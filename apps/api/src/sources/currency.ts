import { NormalizedResult, CurrencyRates, DataStatus } from '@vedasphere/shared';
import { globalSourceRegistry } from './types.js';

const FRANKFURTER_BASE_URL = 'https://api.frankfurter.dev/v1/latest';
const FETCH_TIMEOUT_MS = 5000;

interface CachedCurrencyEntry {
  data: CurrencyRates;
  timestamp: number;
}

let currencyCache: CachedCurrencyEntry | null = null;
let pendingCurrencyPromise: Promise<NormalizedResult<CurrencyRates>> | null = null;

export function clearCurrencyCache(): void {
  currencyCache = null;
  pendingCurrencyPromise = null;
}

async function fetchFrankfurterRate(baseCurrency: string): Promise<{ rate: number; date: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${FRANKFURTER_BASE_URL}?base=${baseCurrency}&symbols=INR`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'VedaSphere/1.0 (Indian City Brief App; contact@vedasphere.local)',
      },
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`Frankfurter API returned HTTP ${response.status}`);
    }

    const json = (await response.json()) as { date: string; rates?: { INR?: number } };

    if (!json || !json.rates || typeof json.rates.INR !== 'number') {
      throw new Error(`Invalid response shape from Frankfurter for base ${baseCurrency}`);
    }

    return {
      rate: json.rates.INR,
      date: json.date || new Date().toISOString().split('T')[0],
    };
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

export function generateDemoCurrencyRates(): CurrencyRates {
  const todayStr = new Date().toISOString().split('T')[0];
  return {
    usdInr: 86.5,
    eurInr: 93.2,
    gbpInr: 109.8,
    rateDate: todayStr,
    note: 'Reference rate, not a live market price',
  };
}

export async function fetchCurrencyData(): Promise<NormalizedResult<CurrencyRates>> {
  const now = Date.now();
  const ttlSeconds = parseInt(process.env.CURRENCY_TTL_SECONDS || '3600', 10);
  const ttlMs = ttlSeconds * 1000;
  const staleMs = 86400 * 1000; // 24 hours

  if (currencyCache && now - currencyCache.timestamp < ttlMs) {
    return {
      data: currencyCache.data,
      source: {
        id: 'frankfurter-currency',
        name: 'Frankfurter Currency API',
        url: FRANKFURTER_BASE_URL,
        attribution: 'Reference rates provided by Frankfurter / European Central Bank',
        ttlSeconds,
      },
      updatedAt: new Date(currencyCache.timestamp).toISOString(),
      status: 'fresh',
    };
  }

  if (pendingCurrencyPromise) {
    return pendingCurrencyPromise;
  }

  pendingCurrencyPromise = (async () => {
    try {
      const [usdRes, eurRes, gbpRes] = await Promise.all([
        fetchFrankfurterRate('USD'),
        fetchFrankfurterRate('EUR'),
        fetchFrankfurterRate('GBP'),
      ]);

      const currencyData: CurrencyRates = {
        usdInr: Math.round(usdRes.rate * 100) / 100,
        eurInr: Math.round(eurRes.rate * 100) / 100,
        gbpInr: Math.round(gbpRes.rate * 100) / 100,
        rateDate: usdRes.date, // Last working day reference rate date
        note: 'Reference rate, not a live market price',
      };

      currencyCache = {
        data: currencyData,
        timestamp: now,
      };

      globalSourceRegistry.recordSuccess('frankfurter-currency');

      return {
        data: currencyData,
        source: {
          id: 'frankfurter-currency',
          name: 'Frankfurter Currency API',
          url: FRANKFURTER_BASE_URL,
          attribution: 'Reference rates provided by Frankfurter / European Central Bank',
          ttlSeconds,
        },
        updatedAt: new Date(now).toISOString(),
        status: 'fresh' as DataStatus,
      };
    } catch (err: any) {
      globalSourceRegistry.recordError('frankfurter-currency', err?.message || 'Failed to fetch currency rates');

      // Stale cache fallback:
      if (currencyCache && now - currencyCache.timestamp < staleMs) {
        return {
          data: currencyCache.data,
          source: {
            id: 'frankfurter-currency',
            name: 'Frankfurter Currency API',
            url: FRANKFURTER_BASE_URL,
            attribution: 'Reference rates provided by Frankfurter / European Central Bank (stale)',
            ttlSeconds,
          },
          updatedAt: new Date(currencyCache.timestamp).toISOString(),
          status: 'stale' as DataStatus,
        };
      }

      // Demo fallback:
      const demoData = generateDemoCurrencyRates();
      return {
        data: demoData,
        source: {
          id: 'frankfurter-currency',
          name: 'VedaSphere Demo Currency Provider',
          url: 'https://vedasphere.local/demo/currency',
          attribution: 'Demo sample rates - VedaSphere internal provider',
          ttlSeconds,
        },
        updatedAt: new Date(now).toISOString(),
        status: 'demo' as DataStatus,
      };
    }
  })();

  try {
    return await pendingCurrencyPromise;
  } finally {
    pendingCurrencyPromise = null;
  }
}
