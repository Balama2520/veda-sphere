import { NormalizedResult, AqiData } from '@vedasphere/shared';
import { Cache } from '../cache/index.js';
import { calculateCpcbAqi } from '../services/aqi.js';
import { getAqiAdvice } from '../services/advice.js';
import { searchCities, CityNotFoundError } from './geocoding.js';
import { globalSourceRegistry } from './types.js';

const ALLOWED_HOST = 'air-quality-api.open-meteo.com';
const TIMEOUT_MS = 5000;
const MAX_BYTES = 2 * 1024 * 1024; // 2MB cap
const USER_NOTE = 'Estimated from model data, not a station reading';
const DEFAULT_TTL_SECONDS = parseInt(process.env.AQI_TTL_SECONDS || '1800', 10);

// Provider interface – a CPCB station or WAQI provider can replace this
export interface AqiProvider {
  getAqi(cityName: string, cache: Cache): Promise<NormalizedResult<AqiData>>;
}

// In-flight coalescing map
const inflightRequests = new Map<string, Promise<NormalizedResult<AqiData>>>();

export function getDemoAqiData(cityName: string): NormalizedResult<AqiData> {
  const advice = getAqiAdvice('Moderate');
  return {
    data: {
      city: cityName,
      aqi: 148,
      category: 'Moderate',
      dominantPollutant: 'PM2.5',
      subIndices: { pm25: 148, pm10: 92 },
      basis: '24h-average',
      advice: advice.text,
      kind: 'model-estimate',
      userNote: USER_NOTE,
    },
    source: {
      id: 'open-meteo-aqi',
      name: 'Open-Meteo Air Quality',
      url: 'https://air-quality-api.open-meteo.com/v1/air-quality',
      attribution: 'Demo sample data – Open-Meteo AQI model fallback',
    },
    updatedAt: new Date().toISOString(),
    status: 'demo',
  };
}

export class OpenMeteoAqiProvider implements AqiProvider {
  async getAqi(cityName: string, cache: Cache): Promise<NormalizedResult<AqiData>> {
    const normCity = cityName.trim();
    const cacheKeyFresh = `aqi:fresh:${normCity.toLowerCase()}`;
    const cacheKeyStale = `aqi:stale:${normCity.toLowerCase()}`;

    // 1. Fresh cache hit
    const fresh = await cache.get<NormalizedResult<AqiData>>(cacheKeyFresh);
    if (fresh) return fresh;

    // 2. Request coalescing
    const inflightKey = `aqi:${normCity.toLowerCase()}`;
    if (inflightRequests.has(inflightKey)) {
      return inflightRequests.get(inflightKey)!;
    }

    const fetchPromise = (async (): Promise<NormalizedResult<AqiData>> => {
      try {
        // Resolve lat/lon via cached geocoding
        const cities = await searchCities(normCity, cache);
        if (!cities || cities.length === 0) {
          throw new CityNotFoundError(normCity);
        }

        const city = cities[0];
        const params = new URLSearchParams({
          latitude: city.latitude.toString(),
          longitude: city.longitude.toString(),
          hourly: 'pm10,pm2_5',
          current: 'pm10,pm2_5',
          past_days: '1',
          forecast_days: '1',
          timezone: 'auto',
        });

        const url = `https://${ALLOWED_HOST}/v1/air-quality?${params.toString()}`;

        let lastError: Error | null = null;
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`Upstream AQI HTTP ${response.status}`);

            const cl = response.headers.get('content-length');
            if (cl && parseInt(cl, 10) > MAX_BYTES) throw new Error('Response too large');

            const raw = await response.json();
            globalSourceRegistry.recordSuccess('open-meteo-aqi', 'fresh');

            const pm25Series: (number | null)[] = raw.hourly?.pm2_5 ?? [];
            const pm10Series: (number | null)[] = raw.hourly?.pm10 ?? [];

            // Use last 24 entries from 48-hour window
            const last24Pm25 = pm25Series.slice(-24);
            const last24Pm10 = pm10Series.slice(-24);

            const calc = calculateCpcbAqi({ pm25Series: last24Pm25, pm10Series: last24Pm10 });
            const advice = getAqiAdvice(calc.category);

            const result: NormalizedResult<AqiData> = {
              data: {
                city: city.name,
                aqi: calc.aqi,
                category: calc.category,
                dominantPollutant: calc.dominantPollutant,
                subIndices: calc.subIndices,
                basis: calc.basis,
                advice: advice.text,
                kind: 'model-estimate',
                userNote: USER_NOTE,
              },
              source: {
                id: 'open-meteo-aqi',
                name: 'Open-Meteo Air Quality',
                url: 'https://air-quality-api.open-meteo.com/v1/air-quality',
                attribution: 'Air quality data by Open-Meteo.com (CC BY 4.0) – CPCB AQI calculation',
              },
              updatedAt: new Date().toISOString(),
              status: 'fresh',
            };

            await cache.set(cacheKeyFresh, result, DEFAULT_TTL_SECONDS);
            await cache.set(cacheKeyStale, result, 86400);
            return result;
          } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            if (attempt < 2) await new Promise((r) => setTimeout(r, 150 * attempt));
          }
        }

        throw lastError!;
      } catch (err) {
        if (err instanceof CityNotFoundError) throw err;

        globalSourceRegistry.recordError('open-meteo-aqi', err instanceof Error ? err : String(err));

        // Stale fallback
        const stale = await cache.get<NormalizedResult<AqiData>>(cacheKeyStale);
        if (stale) return { ...stale, status: 'stale' };

        // Demo fallback
        return getDemoAqiData(normCity);
      } finally {
        inflightRequests.delete(`aqi:${normCity.toLowerCase()}`);
      }
    })();

    inflightRequests.set(inflightKey, fetchPromise);
    return fetchPromise;
  }
}

export const aqiProvider: AqiProvider = new OpenMeteoAqiProvider();
