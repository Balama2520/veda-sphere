import { CityItem } from '@vedasphere/shared';
import { Cache } from '../cache/index.js';
import { globalSourceRegistry } from './types.js';

const ALLOWED_HOST = 'geocoding-api.open-meteo.com';
const TIMEOUT_MS = 5000;
const MAX_BYTES = 1024 * 1024; // 1MB size cap

export class CityNotFoundError extends Error {
  constructor(cityName: string) {
    super(`City '${cityName}' not found. Please try another city.`);
    this.name = 'CityNotFoundError';
  }
}

interface OpenMeteoGeoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string; // State name
  country_code?: string;
  country?: string;
}

interface OpenMeteoGeoResponse {
  results?: OpenMeteoGeoResult[];
}

export async function searchCities(q: string, cache?: Cache): Promise<CityItem[]> {
  const query = q.trim();
  if (!query || query.length < 2) {
    return [];
  }

  const cacheKey = `geo:search:${query.toLowerCase()}`;
  if (cache) {
    const cached = await cache.get<CityItem[]>(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const params = new URLSearchParams({
    name: query,
    count: '10',
    country_code: 'IN',
  });

  const url = `https://${ALLOWED_HOST}/v1/search?${params.toString()}`;

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Upstream geocoding HTTP ${response.status}`);
      }

      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > MAX_BYTES) {
        throw new Error('Response payload size exceeded max limit');
      }

      const data = (await response.json()) as OpenMeteoGeoResponse;
      globalSourceRegistry.recordSuccess('open-meteo-geocoding', 'fresh');

      const rawResults = data.results || [];
      // Filter results for India and map
      const cities: CityItem[] = rawResults
        .filter((r) => !r.country_code || r.country_code.toUpperCase() === 'IN' || r.country === 'India')
        .slice(0, 5)
        .map((r) => ({
          name: r.name,
          state: r.admin1 || 'India',
          latitude: r.latitude,
          longitude: r.longitude,
        }));

      if (cache && cities.length > 0) {
        await cache.set(cacheKey, cities, 86400); // 24 hours TTL
      }

      return cities;
    } catch (err) {
      globalSourceRegistry.recordError('open-meteo-geocoding', err instanceof Error ? err : String(err));
      if (attempts >= maxAttempts) {
        // Return fallback matching known Indian cities if offline/error
        const lowerQ = query.toLowerCase();
        const fallbackCities: CityItem[] = [
          { name: 'Hyderabad', state: 'Telangana', latitude: 17.385, longitude: 78.4867 },
          { name: 'Bengaluru', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946 },
          { name: 'Mumbai', state: 'Maharashtra', latitude: 19.076, longitude: 72.8777 },
          { name: 'Delhi', state: 'Delhi', latitude: 28.6139, longitude: 77.209 },
          { name: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707 },
        ];
        const matched = fallbackCities.filter((c) => c.name.toLowerCase().includes(lowerQ));
        return matched;
      }
      await new Promise((r) => setTimeout(r, 100 * attempts));
    }
  }

  return [];
}
