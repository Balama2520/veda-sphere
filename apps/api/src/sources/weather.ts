import { NormalizedResult, WeatherData } from '@vedasphere/shared';
import { Cache } from '../cache/index.js';
import { getWeatherAdvice } from '../services/advice.js';
import { searchCities, CityNotFoundError } from './geocoding.js';
import { globalSourceRegistry } from './types.js';

const ALLOWED_HOST = 'api.open-meteo.com';
const TIMEOUT_MS = 5000;
const MAX_BYTES = 1024 * 1024;

// In-flight request coalescing map
const inflightRequests = new Map<string, Promise<NormalizedResult<WeatherData>>>();

export function mapWmoCodeToCondition(code: number): string {
  switch (code) {
    case 0:
      return 'Clear sky';
    case 1:
    case 2:
      return 'Partly cloudy';
    case 3:
      return 'Overcast';
    case 45:
    case 48:
      return 'Foggy';
    case 51:
    case 53:
    case 55:
      return 'Light drizzle';
    case 61:
    case 63:
    case 65:
      return 'Rainy';
    case 80:
    case 81:
    case 82:
      return 'Rain showers';
    case 95:
    case 96:
    case 99:
      return 'Thunderstorm';
    default:
      return 'Partly cloudy';
  }
}

export function getDemoWeatherData(cityName: string): NormalizedResult<WeatherData> {
  const temp = 31;
  const humidity = 45;
  const rainChance = 35;
  const todayMax = 34;

  return {
    data: {
      city: cityName,
      temperatureC: temp,
      humidity,
      rainChancePercent: rainChance,
      todayMaxC: todayMax,
      conditionLabel: 'Partly cloudy',
      advice: getWeatherAdvice({ rainChancePercent: rainChance, todayMaxC: todayMax }).text,
    },
    source: {
      id: 'open-meteo-weather',
      name: 'Open-Meteo',
      url: 'https://api.open-meteo.com/v1/forecast',
      attribution: 'Demo sample data - Open-Meteo Weather API fallback',
    },
    updatedAt: new Date().toISOString(),
    status: 'demo',
  };
}

export async function getWeatherForCity(
  cityName: string,
  cache: Cache
): Promise<NormalizedResult<WeatherData>> {
  const normCity = cityName.trim();
  const cacheKeyFresh = `weather:fresh:${normCity.toLowerCase()}`;
  const cacheKeyStale = `weather:stale:${normCity.toLowerCase()}`;

  // 1. Return fresh cached data if available
  const freshCached = await cache.get<NormalizedResult<WeatherData>>(cacheKeyFresh);
  if (freshCached) {
    return freshCached;
  }

  // 2. Coalesce duplicate requests for the same city
  const inflightKey = normCity.toLowerCase();
  if (inflightRequests.has(inflightKey)) {
    return inflightRequests.get(inflightKey)!;
  }

  const fetchPromise = (async (): Promise<NormalizedResult<WeatherData>> => {
    try {
      // Resolve city location
      const cities = await searchCities(normCity, cache);
      if (!cities || cities.length === 0) {
        throw new CityNotFoundError(normCity);
      }

      const cityObj = cities[0];
      const params = new URLSearchParams({
        latitude: cityObj.latitude.toString(),
        longitude: cityObj.longitude.toString(),
        current: 'temperature_2m,relative_humidity_2m,precipitation,weather_code',
        daily: 'precipitation_probability_max,temperature_2m_max',
        timezone: 'auto',
      });

      const url = `https://${ALLOWED_HOST}/v1/forecast?${params.toString()}`;

      let attempts = 0;
      const maxAttempts = 2;
      let lastError: Error | null = null;

      while (attempts < maxAttempts) {
        attempts++;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(timeoutId);

          if (!response.ok) {
            throw new Error(`Upstream weather API HTTP ${response.status}`);
          }

          const contentLength = response.headers.get('content-length');
          if (contentLength && parseInt(contentLength, 10) > MAX_BYTES) {
            throw new Error('Response payload size exceeded max limit');
          }

          const raw = await response.json();
          globalSourceRegistry.recordSuccess('open-meteo-weather', 'fresh');

          const tempC = Math.round(raw.current?.temperature_2m ?? 30);
          const humidity = Math.round(raw.current?.relative_humidity_2m ?? 50);
          const weatherCode = raw.current?.weather_code ?? 0;
          const rainChance = Math.round(raw.daily?.precipitation_probability_max?.[0] ?? 0);
          const todayMaxC = Math.round(raw.daily?.temperature_2m_max?.[0] ?? tempC);

          const resultData: WeatherData = {
            city: cityObj.name,
            temperatureC: tempC,
            humidity,
            rainChancePercent: rainChance,
            todayMaxC,
            conditionLabel: mapWmoCodeToCondition(weatherCode),
            advice: getWeatherAdvice({ rainChancePercent: rainChance, todayMaxC }).text,
          };

          const freshResult: NormalizedResult<WeatherData> = {
            data: resultData,
            source: {
              id: 'open-meteo-weather',
              name: 'Open-Meteo',
              url: 'https://api.open-meteo.com/v1/forecast',
              attribution: 'Weather data by Open-Meteo.com (CC BY 4.0)',
            },
            updatedAt: new Date().toISOString(),
            status: 'fresh',
          };

          // Cache fresh (15 mins) and snapshot for stale (24 hrs)
          await cache.set(cacheKeyFresh, freshResult, 900);
          await cache.set(cacheKeyStale, freshResult, 86400);

          return freshResult;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          if (attempts < maxAttempts) {
            await new Promise((r) => setTimeout(r, 100 * attempts));
          }
        }
      }

      throw lastError || new Error('Failed to fetch weather from upstream');
    } catch (err) {
      if (err instanceof CityNotFoundError) {
        throw err;
      }

      globalSourceRegistry.recordError('open-meteo-weather', err instanceof Error ? err : String(err));

      // Fallback 2: Check stale cached snapshot
      const staleCached = await cache.get<NormalizedResult<WeatherData>>(cacheKeyStale);
      if (staleCached) {
        return {
          ...staleCached,
          status: 'stale',
        };
      }

      // Fallback 3: Return demo sample data
      return getDemoWeatherData(normCity);
    } finally {
      inflightRequests.delete(inflightKey);
    }
  })();

  inflightRequests.set(inflightKey, fetchPromise);
  return fetchPromise;
}
