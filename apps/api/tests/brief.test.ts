import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildServer } from '../src/server.js';
import { InMemoryCache } from '../src/cache/index.js';

const geoResponse = (name = 'Hyderabad', state = 'Telangana') => ({
  ok: true,
  headers: new Map(),
  json: async () => ({ results: [{ id: 1, name, latitude: 17.385, longitude: 78.4867, admin1: state, country_code: 'IN' }] }),
});

const weatherResponse = () => ({
  ok: true,
  headers: new Map(),
  json: async () => ({
    current: { temperature_2m: 33, relative_humidity_2m: 40, weather_code: 0 },
    daily: { precipitation_probability_max: [10], temperature_2m_max: [35] },
  }),
});

const aqiResponse = () => ({
  ok: true,
  headers: new Map(),
  json: async () => ({
    current: { pm10: 75, pm2_5: 55 },
    hourly: {
      time: Array.from({ length: 48 }, (_, i) => `2026-10-0${Math.floor(i / 24) + 4}T${String(i % 24).padStart(2, '0')}:00`),
      pm2_5: Array(48).fill(55),
      pm10: Array(48).fill(75),
    },
  }),
});

describe('Phase 3 – AQI Source & Brief Route Tests', () => {
  const originalFetch = global.fetch;

  beforeEach(() => { vi.restoreAllMocks(); });
  afterEach(() => { global.fetch = originalFetch; });

  it('GET /v1/brief returns all parts fresh when both sources succeed', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('geocoding-api')) return geoResponse();
      if (url.includes('api.open-meteo.com/v1/forecast')) return weatherResponse();
      if (url.includes('air-quality-api')) return aqiResponse();
      throw new Error(`Unhandled: ${url}`);
    }) as unknown as typeof fetch;

    const { app } = await buildServer({ logger: false });
    const res = await app.inject({ method: 'GET', url: '/v1/brief?city=Hyderabad' });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.city).toBe('Hyderabad');
    expect(body.weather.status).toBe('fresh');
    expect(body.aqi.status).toBe('fresh');
    expect(body.overallStatus).toBe('fresh');
    expect(Array.isArray(body.lines)).toBe(true);
    expect(body.lines.length).toBeGreaterThan(0);
    expect(body.aqi.data.kind).toBe('model-estimate');
    expect(body.aqi.data.userNote).toContain('not a station reading');
  });

  it('GET /v1/brief still returns weather when AQI is down', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('geocoding-api')) return geoResponse();
      if (url.includes('api.open-meteo.com/v1/forecast')) return weatherResponse();
      if (url.includes('air-quality-api')) throw new Error('AQI upstream down');
      throw new Error(`Unhandled: ${url}`);
    }) as unknown as typeof fetch;

    const { app } = await buildServer({ logger: false });
    const res = await app.inject({ method: 'GET', url: '/v1/brief?city=Hyderabad' });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.weather.status).toBe('fresh');
    expect(body.aqi.status).toBe('demo');
    expect(body.overallStatus).toBe('demo');
    const unavailLine = body.lines.find((l: { id: string }) => l.id === 'aqi-unavailable');
    expect(unavailLine).toBeTruthy();
  });

  it('GET /v1/brief still returns AQI when weather is down but AQI is up', async () => {
    let geoCallCount = 0;
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('geocoding-api')) { geoCallCount++; return geoResponse(); }
      if (url.includes('api.open-meteo.com/v1/forecast')) throw new Error('Weather down');
      if (url.includes('air-quality-api')) return aqiResponse();
      throw new Error(`Unhandled: ${url}`);
    }) as unknown as typeof fetch;

    const { app } = await buildServer({ logger: false });
    const res = await app.inject({ method: 'GET', url: '/v1/brief?city=Hyderabad' });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.weather.status).toBe('demo');
    expect(body.aqi.status).toBe('fresh');
  });

  it('GET /v1/brief returns 404 for unknown city', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('geocoding-api')) return { ok: true, headers: new Map(), json: async () => ({ results: [] }) };
      throw new Error('Should not reach forecast');
    }) as unknown as typeof fetch;

    const { app } = await buildServer({ logger: false });
    const res = await app.inject({ method: 'GET', url: '/v1/brief?city=XyzabcNotACity' });
    expect(res.statusCode).toBe(404);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe('CITY_NOT_FOUND');
  });

  it('GET /v1/brief returns 400 for invalid input', async () => {
    const { app } = await buildServer({ logger: false });
    const res = await app.inject({ method: 'GET', url: '/v1/brief?city=a' });
    expect(res.statusCode).toBe(400);
  });

  it('Brief lines are sorted with warnings before info', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('geocoding-api')) return geoResponse();
      if (url.includes('api.open-meteo.com/v1/forecast')) return {
        ok: true, headers: new Map(),
        json: async () => ({
          current: { temperature_2m: 39, relative_humidity_2m: 20, weather_code: 0 },
          daily: { precipitation_probability_max: [60], temperature_2m_max: [42] },
        }),
      };
      if (url.includes('air-quality-api')) return aqiResponse();
      throw new Error(`Unhandled: ${url}`);
    }) as unknown as typeof fetch;

    const { app } = await buildServer({ logger: false });
    const res = await app.inject({ method: 'GET', url: '/v1/brief?city=Hyderabad' });
    const body = JSON.parse(res.body);
    const severities = body.lines.map((l: { severity: string }) => l.severity);
    const rank: Record<string, number> = { warning: 2, caution: 1, info: 0 };
    for (let i = 1; i < severities.length; i++) {
      expect(rank[severities[i]]).toBeLessThanOrEqual(rank[severities[i - 1]]);
    }
  });

  it('AQI source returns stale when upstream fails but last snapshot exists', async () => {
    const cache = new InMemoryCache();
    const stale: import('@vedasphere/shared').NormalizedResult<import('@vedasphere/shared').AqiData> = {
      data: { city: 'Delhi', aqi: 280, category: 'Poor', dominantPollutant: 'PM10', subIndices: { pm25: 200, pm10: 280 }, basis: '24h-average', advice: 'Wear mask', kind: 'model-estimate', userNote: 'Estimated from model data, not a station reading' },
      source: { id: 'open-meteo-aqi', name: 'Open-Meteo Air Quality', url: 'https://air-quality-api.open-meteo.com' },
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      status: 'fresh',
    };
    await cache.set('aqi:stale:delhi', stale, 86400);

    global.fetch = vi.fn().mockImplementation(async () => { throw new Error('Network error'); }) as unknown as typeof fetch;

    const { app } = await buildServer({ cache, logger: false });
    const res = await app.inject({ method: 'GET', url: '/v1/brief?city=Delhi' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.aqi.status).toBe('stale');
    expect(body.aqi.data.city).toBe('Delhi');
  });

  it('AQI source returns demo when no cache and upstream fails', async () => {
    global.fetch = vi.fn().mockImplementation(async () => { throw new Error('Network error'); }) as unknown as typeof fetch;
    const { app } = await buildServer({ logger: false });
    const res = await app.inject({ method: 'GET', url: '/v1/brief?city=Chennai' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.aqi.status).toBe('demo');
  });

  it('AQI coalescing sends only one upstream call for many parallel requests', async () => {
    let aqiFetchCount = 0;
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('geocoding-api')) return geoResponse('Pune', 'Maharashtra');
      if (url.includes('api.open-meteo.com/v1/forecast')) return weatherResponse();
      if (url.includes('air-quality-api')) {
        aqiFetchCount++;
        await new Promise((r) => setTimeout(r, 50));
        return aqiResponse();
      }
      throw new Error(`Unhandled: ${url}`);
    }) as unknown as typeof fetch;

    const cache = new InMemoryCache();
    const { app } = await buildServer({ cache, logger: false });

    const promises = Array.from({ length: 50 }, () =>
      app.inject({ method: 'GET', url: '/v1/brief?city=Pune' })
    );
    const responses = await Promise.all(promises);
    responses.forEach((r) => expect(r.statusCode).toBe(200));
    expect(aqiFetchCount).toBe(1);
  });
});
