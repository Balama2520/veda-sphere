import {
  NormalizedResult,
  PricesData,
  FuelPriceItem,
  PreciousMetalsItem,
  MarketIndexItem,
  DataStatus,
} from '@vedasphere/shared';
import { fetchCurrencyData } from './currency.js';
import { globalSourceRegistry } from './types.js';

export interface PriceProvider<T> {
  category: string;
  getPrices(city: string): Promise<T>;
}

export class DemoFuelPriceProvider implements PriceProvider<FuelPriceItem> {
  category = 'fuel';

  async getPrices(_city: string): Promise<FuelPriceItem> {
    return {
      petrolPerLitre: 106.31,
      dieselPerLitre: 94.27,
      unit: '₹/L',
      status: 'demo',
      isSample: true,
      note: 'Sample data, not a real price',
    };
  }
}

export class DemoPreciousMetalsPriceProvider implements PriceProvider<PreciousMetalsItem> {
  category = 'preciousMetals';

  async getPrices(_city: string): Promise<PreciousMetalsItem> {
    return {
      gold24kPer10g: 78500,
      silverPerKg: 92000,
      unit: '₹',
      status: 'demo',
      isSample: true,
      note: 'Sample data, not a real price',
    };
  }
}

export class DemoMarketIndexPriceProvider implements PriceProvider<MarketIndexItem> {
  category = 'marketIndex';

  async getPrices(_city: string): Promise<MarketIndexItem> {
    return {
      nifty50: 24850.45,
      sensex: 81200.3,
      status: 'demo',
      isSample: true,
      isDelayed: true,
      note: 'Sample data, not a real price (Delayed)',
    };
  }
}

const fuelProvider = new DemoFuelPriceProvider();
const metalsProvider = new DemoPreciousMetalsPriceProvider();
const indexProvider = new DemoMarketIndexPriceProvider();

interface CachedPricesEntry {
  data: PricesData;
  timestamp: number;
}

const pricesCache = new Map<string, CachedPricesEntry>();
const pendingPricesPromises = new Map<string, Promise<NormalizedResult<PricesData>>>();

export function clearPricesCache(): void {
  pricesCache.clear();
  pendingPricesPromises.clear();
}

export async function fetchPricesData(city = 'Hyderabad'): Promise<NormalizedResult<PricesData>> {
  const normCity = city.trim().toLowerCase();
  const now = Date.now();
  const ttlSeconds = parseInt(process.env.PRICES_TTL_SECONDS || '3600', 10);
  const ttlMs = ttlSeconds * 1000;

  const cached = pricesCache.get(normCity);
  if (cached && now - cached.timestamp < ttlMs) {
    return {
      data: cached.data,
      source: {
        id: 'demo-prices-provider',
        name: 'VedaSphere Demo Price Provider',
        url: 'https://vedasphere.local/demo/prices',
        attribution: 'Demo sample data - VedaSphere internal provider',
        ttlSeconds,
      },
      updatedAt: new Date(cached.timestamp).toISOString(),
      status: 'demo',
    };
  }

  const pending = pendingPricesPromises.get(normCity);
  if (pending) {
    return pending;
  }

  const promise = (async () => {
    // Failure isolation per category
    const currencyRes = await fetchCurrencyData().catch(() => ({
      data: {
        usdInr: 86.5,
        eurInr: 93.2,
        gbpInr: 109.8,
        rateDate: new Date().toISOString().split('T')[0],
        note: 'Demo reference rate - fallback',
      },
      status: 'demo' as DataStatus,
    }));

    let fuelData: FuelPriceItem;
    try {
      fuelData = await fuelProvider.getPrices(city);
    } catch {
      fuelData = {
        petrolPerLitre: 0,
        dieselPerLitre: 0,
        unit: '₹/L',
        status: 'demo',
        isSample: true,
        note: 'Fuel data currently unavailable',
      };
    }

    let metalsData: PreciousMetalsItem;
    try {
      metalsData = await metalsProvider.getPrices(city);
    } catch {
      metalsData = {
        gold24kPer10g: 0,
        silverPerKg: 0,
        unit: '₹',
        status: 'demo',
        isSample: true,
        note: 'Metals data currently unavailable',
      };
    }

    let indexData: MarketIndexItem;
    try {
      indexData = await indexProvider.getPrices(city);
    } catch {
      indexData = {
        nifty50: 0,
        sensex: 0,
        status: 'demo',
        isSample: true,
        isDelayed: true,
        note: 'Market index currently unavailable',
      };
    }

    const pricesData: PricesData = {
      city,
      currency: {
        usdInr: currencyRes.data.usdInr,
        eurInr: currencyRes.data.eurInr,
        gbpInr: currencyRes.data.gbpInr,
        rateDate: currencyRes.data.rateDate,
        note: currencyRes.data.note,
        status: currencyRes.status,
      },
      fuel: fuelData,
      preciousMetals: metalsData,
      marketIndex: indexData,
    };

    pricesCache.set(normCity, {
      data: pricesData,
      timestamp: now,
    });

    globalSourceRegistry.recordSuccess('demo-prices-provider');

    return {
      data: pricesData,
      source: {
        id: 'demo-prices-provider',
        name: 'VedaSphere Demo Price Provider',
        url: 'https://vedasphere.local/demo/prices',
        attribution: 'Demo sample data - VedaSphere internal provider',
        ttlSeconds,
      },
      updatedAt: new Date(now).toISOString(),
      status: 'demo' as DataStatus,
    };
  })();

  pendingPricesPromises.set(normCity, promise);

  try {
    return await promise;
  } finally {
    pendingPricesPromises.delete(normCity);
  }
}
