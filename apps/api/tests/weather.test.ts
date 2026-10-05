import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildServer } from '../src/server.js';
import { InMemoryCache } from '../src/cache/index.js';

describe('Phase 2 - Weather & Geocoding API Tests', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('GET /v1/cities/search returns mapped Indian cities', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('geocoding-api.open-meteo.com')) {
        return {
          ok: true,
          headers: new Map(),
          json: async () => ({
            results: [
              {
                id: 1,
                name: 'Hyderabad',
                latitude: 17.385,
                longitude: 78.4867,
                admin1: 'Telangana',
                country_code: 'IN',
                country: 'India',
              },
            ],
          }),
        };
      }
      throw new Error(`Unhandled fetch URL: ${url}`);
    }) as unknown as typeof fetch;

    const { app } = await buildServer({ logger: false });
    const response = await app.inject({
      method: 'GET',
      url: '/v1/cities/search?q=Hyderabad',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(1);
    expect(body[0]).toEqual({
      name: 'Hyderabad',
      state: 'Telangana',
      latitude: 17.385,
      longitude: 78.4867,
    });
  });

  it('GET /v1/cities/search returns 400 for invalid query length', async () => {
    const { app } = await buildServer({ logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/cities/search?q=a',
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.error.code).toBe('BAD_REQUEST');
  });

  it('GET /v1/weather returns fresh weather data on successful upstream fetch', async () => {
    let fetchCount = 0;
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      fetchCount++;
      if (url.includes('geocoding-api.open-meteo.com')) {
        return {
          ok: true,
          headers: new Map(),
          json: async () => ({
            results: [
              {
                id: 1,
                name: 'Hyderabad',
                latitude: 17.385,
                longitude: 78.4867,
                admin1: 'Telangana',
                country_code: 'IN',
              },
            ],
          }),
        };
      }
      if (url.includes('api.open-meteo.com/v1/forecast')) {
        return {
          ok: true,
          headers: new Map(),
          json: async () => ({
            current: {
              temperature_2m: 32.4,
              relative_humidity_2m: 40,
              weather_code: 0,
            },
            daily: {
              precipitation_probability_max: [10],
              temperature_2m_max: [35],
            },
          }),
        };
      }
      throw new Error(`Unhandled URL: ${url}`);
    }) as unknown as typeof fetch;

    const cache = new InMemoryCache();
    const { app } = await buildServer({ cache, logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/weather?city=Hyderabad',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('fresh');
    expect(body.data.city).toBe('Hyderabad');
    expect(body.data.temperatureC).toBe(32);
    expect(body.data.humidity).toBe(40);
    expect(body.data.rainChancePercent).toBe(10);
    expect(body.data.todayMaxC).toBe(35);
    expect(body.data.conditionLabel).toBe('Clear sky');
    expect(body.data.advice).toBe('Pleasant weather today. Enjoy your day.');
    expect(body.source.id).toBe('open-meteo-weather');

    // Test Cache Hit - Second call should hit cache and NOT make another fetch
    const fetchCountBefore = fetchCount;
    const response2 = await app.inject({
      method: 'GET',
      url: '/v1/weather?city=Hyderabad',
    });
    expect(response2.statusCode).toBe(200);
    expect(fetchCount).toBe(fetchCountBefore); // No new network call
  });

  it('GET /v1/weather returns 404 for unknown city', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('geocoding-api.open-meteo.com')) {
        return {
          ok: true,
          headers: new Map(),
          json: async () => ({ results: [] }),
        };
      }
      throw new Error('Should not reach forecast for unknown city');
    }) as unknown as typeof fetch;

    const { app } = await buildServer({ logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/weather?city=XyzabcNotACity',
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.error.code).toBe('CITY_NOT_FOUND');
    expect(body.error.message).toContain('XyzabcNotACity');
  });

  it('GET /v1/weather returns STALE data when upstream fails but last good data exists', async () => {
    const cache = new InMemoryCache();

    // Seed stale cache snapshot
    const staleSnapshot = {
      data: {
        city: 'Mumbai',
        temperatureC: 30,
        humidity: 70,
        rainChancePercent: 60,
        todayMaxC: 33,
        conditionLabel: 'Rainy',
        advice: 'Rain likely today. Take an umbrella.',
      },
      source: {
        id: 'open-meteo-weather',
        name: 'Open-Meteo',
        url: 'https://api.open-meteo.com/v1/forecast',
      },
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      status: 'fresh' as const,
    };
    await cache.set('weather:stale:mumbai', staleSnapshot, 86400);

    // Mock upstream failure
    global.fetch = vi.fn().mockImplementation(async () => {
      throw new Error('Network error or Wi-Fi disconnected');
    }) as unknown as typeof fetch;

    const { app } = await buildServer({ cache, logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/weather?city=Mumbai',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('stale');
    expect(body.data.city).toBe('Mumbai');
    expect(body.data.temperatureC).toBe(30);
  });

  it('GET /v1/weather returns DEMO data when upstream fails and no cached data exists', async () => {
    global.fetch = vi.fn().mockImplementation(async () => {
      throw new Error('Network error');
    }) as unknown as typeof fetch;

    const { app } = await buildServer({ logger: false });

    const response = await app.inject({
      method: 'GET',
      url: '/v1/weather?city=Bengaluru',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.status).toBe('demo');
    expect(body.data.city).toBe('Bengaluru');
    expect(body.source.id).toBe('open-meteo-weather');
  });

  it('GET /v1/weather coalesces 100 simultaneous requests into ONE upstream fetch', async () => {
    let forecastFetchCount = 0;
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('geocoding-api.open-meteo.com')) {
        return {
          ok: true,
          headers: new Map(),
          json: async () => ({
            results: [
              {
                id: 1,
                name: 'Chennai',
                latitude: 13.0827,
                longitude: 80.2707,
                admin1: 'Tamil Nadu',
                country_code: 'IN',
              },
            ],
          }),
        };
      }
      if (url.includes('api.open-meteo.com/v1/forecast')) {
        forecastFetchCount++;
        // Artificial delay to simulate network latency during concurrent requests
        await new Promise((r) => setTimeout(r, 50));
        return {
          ok: true,
          headers: new Map(),
          json: async () => ({
            current: { temperature_2m: 31, relative_humidity_2m: 60, weather_code: 1 },
            daily: { precipitation_probability_max: [20], temperature_2m_max: [34] },
          }),
        };
      }
      throw new Error(`Unhandled URL: ${url}`);
    }) as unknown as typeof fetch;

    const cache = new InMemoryCache();
    const { app } = await buildServer({ cache, logger: false });

    // Fire 100 simultaneous requests
    const promises = Array.from({ length: 100 }, () =>
      app.inject({
        method: 'GET',
        url: '/v1/weather?city=Chennai',
      })
    );

    const responses = await Promise.all(promises);

    responses.forEach((res) => {
      expect(res.statusCode).toBe(200);
      const b = JSON.parse(res.body);
      expect(b.data.city).toBe('Chennai');
    });

    // Exactly 1 upstream forecast call occurred despite 100 requests
    expect(forecastFetchCount).toBe(1);
  });
});
