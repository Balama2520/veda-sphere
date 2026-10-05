import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildServer } from '../src/server.js';
import { InMemoryCache } from '../src/cache/index.js';

describe('GET /v1/cities/search', () => {
  const originalFetch = global.fetch;

  beforeEach(() => { vi.restoreAllMocks(); });
  afterEach(() => { global.fetch = originalFetch; });

  it('returns 400 for query shorter than 2 characters', async () => {
    const { app } = await buildServer({ logger: false });
    const res = await app.inject({ method: 'GET', url: '/v1/cities/search?q=a' });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe('BAD_REQUEST');
    expect(body.error.message).toMatch(/2/);
  });

  it('returns 400 for missing q parameter', async () => {
    const { app } = await buildServer({ logger: false });
    const res = await app.inject({ method: 'GET', url: '/v1/cities/search' });
    expect(res.statusCode).toBe(400);
  });

  it('maps upstream geocoding result to CityItem shape', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('geocoding-api.open-meteo.com')) {
        return {
          ok: true,
          headers: new Map(),
          json: async () => ({
            results: [
              { id: 1, name: 'Hyderabad', latitude: 17.385, longitude: 78.4867, admin1: 'Telangana', country_code: 'IN', country: 'India' },
              { id: 2, name: 'Hyderabad District', latitude: 17.4, longitude: 78.5, admin1: 'Telangana', country_code: 'IN', country: 'India' },
            ],
          }),
        };
      }
      throw new Error('Unexpected URL');
    }) as unknown as typeof fetch;

    const { app } = await buildServer({ logger: false });
    const res = await app.inject({ method: 'GET', url: '/v1/cities/search?q=Hyderabad' });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(1);
    const city = body[0];
    expect(city).toHaveProperty('name', 'Hyderabad');
    expect(city).toHaveProperty('state', 'Telangana');
    expect(city).toHaveProperty('latitude');
    expect(city).toHaveProperty('longitude');
    expect(typeof city.latitude).toBe('number');
    expect(typeof city.longitude).toBe('number');
  });

  it('filters out non-Indian results', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('geocoding-api.open-meteo.com')) {
        return {
          ok: true,
          headers: new Map(),
          json: async () => ({
            results: [
              { id: 1, name: 'Hyderabad', latitude: 17.385, longitude: 78.4867, admin1: 'Telangana', country_code: 'IN', country: 'India' },
              { id: 2, name: 'Hyderabad', latitude: 25.4, longitude: 68.4, admin1: 'Sindh', country_code: 'PK', country: 'Pakistan' },
            ],
          }),
        };
      }
      throw new Error('Unexpected URL');
    }) as unknown as typeof fetch;

    const { app } = await buildServer({ logger: false });
    const res = await app.inject({ method: 'GET', url: '/v1/cities/search?q=Hyderabad' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    body.forEach((city: { state: string }) => {
      // All returned cities should be from India (not Pakistan)
      expect(city.state).not.toBe('Sindh');
    });
  });

  it('returns empty array when no city matches', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('geocoding-api.open-meteo.com')) {
        return {
          ok: true,
          headers: new Map(),
          json: async () => ({ results: [] }),
        };
      }
      throw new Error('Unexpected URL');
    }) as unknown as typeof fetch;

    const { app } = await buildServer({ logger: false });
    const res = await app.inject({ method: 'GET', url: '/v1/cities/search?q=Xyzabc' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([]);
  });

  it('caches geocoding results for 24 hours', async () => {
    let fetchCount = 0;
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('geocoding-api.open-meteo.com')) {
        fetchCount++;
        return {
          ok: true,
          headers: new Map(),
          json: async () => ({
            results: [{ id: 1, name: 'Mumbai', latitude: 19.076, longitude: 72.877, admin1: 'Maharashtra', country_code: 'IN' }],
          }),
        };
      }
      throw new Error('Unexpected URL');
    }) as unknown as typeof fetch;

    const cache = new InMemoryCache();
    const { app } = await buildServer({ cache, logger: false });

    await app.inject({ method: 'GET', url: '/v1/cities/search?q=Mumbai' });
    await app.inject({ method: 'GET', url: '/v1/cities/search?q=Mumbai' }); // should hit cache
    expect(fetchCount).toBe(1); // only one upstream call
  });
});
