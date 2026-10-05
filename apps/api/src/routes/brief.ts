import { FastifyInstance } from 'fastify';
import {
  BriefQuerySchema,
  NormalizedResult,
  WeatherData,
  AqiData,
  NewsData,
  PricesData,
  BriefLine,
  DataStatus,
} from '@vedasphere/shared';
import { Cache } from '../cache/index.js';
import { getWeatherForCity } from '../sources/weather.js';
import { aqiProvider } from '../sources/aqi.js';
import { fetchNewsData } from '../sources/news.js';
import { fetchPricesData } from '../sources/prices.js';
import { CityNotFoundError } from '../sources/geocoding.js';
import { getWeatherAdvice, getAqiAdvice } from '../services/advice.js';

export function worstStatus(...statuses: DataStatus[]): DataStatus {
  const rank: Record<DataStatus, number> = { fresh: 0, stale: 1, demo: 2 };
  let worst: DataStatus = 'fresh';
  for (const s of statuses) {
    if (rank[s] > rank[worst]) {
      worst = s;
    }
  }
  return worst;
}

export function buildBriefLines(
  weather: NormalizedResult<WeatherData>,
  aqi: NormalizedResult<AqiData>
): BriefLine[] {
  const lines: BriefLine[] = [];

  if (weather.status !== 'demo') {
    const rainAdvice = getWeatherAdvice({
      rainChancePercent: weather.data.rainChancePercent,
      todayMaxC: weather.data.todayMaxC,
    });
    lines.push({
      id: 'rain',
      icon: 'umbrella',
      text: rainAdvice.text,
      severity: rainAdvice.severity,
      sourceId: 'open-meteo-weather',
      status: weather.status,
      updatedAt: weather.updatedAt,
    });

    if (weather.data.todayMaxC >= 38 && weather.data.rainChancePercent < 50) {
      lines.push({
        id: 'heat',
        icon: 'sun',
        text: 'Very hot. Drink water and avoid midday sun.',
        severity: 'warning',
        sourceId: 'open-meteo-weather',
        status: weather.status,
        updatedAt: weather.updatedAt,
      });
    }
  } else {
    lines.push({
      id: 'weather-unavailable',
      icon: 'cloud-off',
      text: 'Weather data is temporarily unavailable.',
      severity: 'info',
      sourceId: 'open-meteo-weather',
      status: 'demo',
      updatedAt: weather.updatedAt,
    });
  }

  if (aqi.status !== 'demo') {
    const aqiAdvice = getAqiAdvice(aqi.data.category);
    lines.push({
      id: 'aqi',
      icon: 'wind',
      text: aqiAdvice.text,
      severity: aqiAdvice.severity,
      sourceId: 'open-meteo-aqi',
      status: aqi.status,
      updatedAt: aqi.updatedAt,
    });
  } else {
    lines.push({
      id: 'aqi-unavailable',
      icon: 'wind',
      text: 'Air quality data is temporarily unavailable.',
      severity: 'info',
      sourceId: 'open-meteo-aqi',
      status: 'demo',
      updatedAt: aqi.updatedAt,
    });
  }

  // Sort by severity: warning > caution > info
  const severityRank: Record<string, number> = { warning: 2, caution: 1, info: 0 };
  lines.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);

  return lines;
}

export function registerBriefRoutes(app: FastifyInstance, cache: Cache): void {
  app.get('/v1/brief', async (request, reply) => {
    const parseResult = BriefQuerySchema.safeParse(request.query || {});
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return reply.status(400).send({
        error: { code: 'BAD_REQUEST', message: issue?.message || 'Invalid parameters' },
      });
    }

    const { city } = parseResult.data;

    // Fetch weather, AQI, news, and prices in parallel; failure isolation
    const [weatherResult, aqiResult, newsResult, pricesResult] = await Promise.allSettled([
      getWeatherForCity(city, cache),
      aqiProvider.getAqi(city, cache),
      fetchNewsData(3), // Top 3 items for brief
      fetchPricesData(city),
    ]);

    // Handle unknown city from weather (primary source for city resolution)
    if (weatherResult.status === 'rejected') {
      const err = weatherResult.reason;
      if (err instanceof CityNotFoundError) {
        return reply.status(404).send({
          error: { code: 'CITY_NOT_FOUND', message: err.message },
        });
      }
    }

    const weather: NormalizedResult<WeatherData> =
      weatherResult.status === 'fulfilled'
        ? weatherResult.value
        : {
            data: {
              city,
              temperatureC: 0,
              humidity: 0,
              rainChancePercent: 0,
              todayMaxC: 0,
              conditionLabel: 'Unknown',
              advice: 'Weather data unavailable.',
            },
            source: { id: 'open-meteo-weather', name: 'Open-Meteo', url: 'https://api.open-meteo.com' },
            updatedAt: new Date().toISOString(),
            status: 'demo',
          };

    const aqi: NormalizedResult<AqiData> =
      aqiResult.status === 'fulfilled'
        ? aqiResult.value
        : {
            data: {
              city,
              aqi: 0,
              category: 'Good',
              dominantPollutant: 'None',
              subIndices: { pm25: null, pm10: null },
              basis: '24h-average',
              advice: 'Air quality data unavailable.',
              kind: 'model-estimate',
              userNote: 'Estimated from model data, not a station reading',
            },
            source: { id: 'open-meteo-aqi', name: 'Open-Meteo Air Quality', url: 'https://air-quality-api.open-meteo.com' },
            updatedAt: new Date().toISOString(),
            status: 'demo',
          };

    const news: NormalizedResult<NewsData> =
      newsResult.status === 'fulfilled'
        ? newsResult.value
        : {
            data: { items: [] },
            source: { id: 'indian-news-rss', name: 'Public News RSS', url: 'https://news.google.com/rss' },
            updatedAt: new Date().toISOString(),
            status: 'demo',
          };

    const prices: NormalizedResult<PricesData> =
      pricesResult.status === 'fulfilled'
        ? pricesResult.value
        : {
            data: {
              city,
              currency: {
                usdInr: 86.5,
                eurInr: 93.2,
                gbpInr: 109.8,
                rateDate: new Date().toISOString().split('T')[0],
                note: 'Demo reference rate',
                status: 'demo',
              },
              fuel: {
                petrolPerLitre: 106.31,
                dieselPerLitre: 94.27,
                unit: '₹/L',
                status: 'demo',
                isSample: true,
                note: 'Sample data',
              },
              preciousMetals: {
                gold24kPer10g: 78500,
                silverPerKg: 92000,
                unit: '₹',
                status: 'demo',
                isSample: true,
                note: 'Sample data',
              },
              marketIndex: {
                nifty50: 24850.45,
                sensex: 81200.3,
                status: 'demo',
                isSample: true,
                isDelayed: true,
                note: 'Sample data (Delayed)',
              },
            },
            source: { id: 'demo-prices-provider', name: 'Demo Prices', url: 'https://vedasphere.local/demo/prices' },
            updatedAt: new Date().toISOString(),
            status: 'demo',
          };

    const lines = buildBriefLines(weather, aqi);
    const overallStatus = worstStatus(weather.status, aqi.status);

    return reply.send({
      city: weather.data.city || city,
      generatedAt: new Date().toISOString(),
      lines,
      weather,
      aqi,
      news,
      prices,
      overallStatus,
    });
  });
}
