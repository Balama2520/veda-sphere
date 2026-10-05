import { describe, it, expect, beforeEach } from 'vitest';
import { buildServer } from '../src/server.js';
import { InMemoryCache } from '../src/cache/index.js';
import { DataStatusSchema, NormalizedResultSchema } from '@vedasphere/shared';
import { z } from 'zod';

describe('Phase 1 - Infrastructure & Health API Tests', () => {
  it('GET /health returns 200 with valid health schema', async () => {
    const { app } = await buildServer({ logger: false });
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);

    expect(body).toHaveProperty('status');
    expect(['ok', 'degraded', 'error']).toContain(body.status);
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('uptime');
    expect(body).toHaveProperty('cache');
    expect(body.cache).toHaveProperty('size');
    expect(body.cache).toHaveProperty('hits');
    expect(body.cache).toHaveProperty('misses');
    expect(body).toHaveProperty('sources');
    expect(body).toHaveProperty('memory');
  });

  it('InMemoryCache handles TTL expiration and LRU eviction', async () => {
    const cache = new InMemoryCache(2); // capacity of 2 items

    // 1. Set two items
    await cache.set('item1', 'value1', 10);
    await cache.set('item2', 'value2', 10);

    // 2. Access item1 to make it most recently used (item2 becomes LRU)
    expect(await cache.get('item1')).toBe('value1');

    // 3. Add 3rd item - item2 is LRU and should be evicted
    await cache.set('item3', 'value3', 10);
    expect(await cache.get('item2')).toBeNull(); // evicted
    expect(await cache.get('item1')).toBe('value1');
    expect(await cache.get('item3')).toBe('value3');

    // 3. Test TTL expiration
    await cache.set('shortItem', 'quick', 0.01); // 10ms TTL
    await new Promise((r) => setTimeout(r, 20));
    expect(await cache.get('shortItem')).toBeNull();

    // 4. Check cache stats
    const stats = cache.getStats();
    expect(stats.maxSize).toBe(2);
    expect(stats.hits).toBeGreaterThan(0);
    expect(stats.misses).toBeGreaterThan(0);
  });

  it('NormalizedResult schema validates fresh, stale, and demo data contracts', () => {
    const sampleSchema = NormalizedResultSchema(z.object({ temp: z.number() }));

    const freshResult = {
      data: { temp: 28 },
      source: {
        id: 'open-meteo-weather',
        name: 'Open-Meteo',
        url: 'https://api.open-meteo.com/v1/forecast',
      },
      updatedAt: new Date().toISOString(),
      status: 'fresh' as const,
    };

    const parseResult = sampleSchema.safeParse(freshResult);
    expect(parseResult.success).toBe(true);

    const invalidStatus = {
      ...freshResult,
      status: 'broken',
    };
    expect(sampleSchema.safeParse(invalidStatus).success).toBe(false);
  });

  it('DataStatusSchema accepts only fresh, stale, demo', () => {
    expect(DataStatusSchema.safeParse('fresh').success).toBe(true);
    expect(DataStatusSchema.safeParse('stale').success).toBe(true);
    expect(DataStatusSchema.safeParse('demo').success).toBe(true);
    expect(DataStatusSchema.safeParse('invalid').success).toBe(false);
  });
});
