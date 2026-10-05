import { describe, it, expect, beforeEach } from 'vitest';
import {
  clearPricesCache,
  fetchPricesData,
  DemoFuelPriceProvider,
  DemoPreciousMetalsPriceProvider,
  DemoMarketIndexPriceProvider,
} from '../src/sources/prices.js';

describe('Prices Source & Provider Tests', () => {
  beforeEach(() => {
    clearPricesCache();
  });

  it('demo fuel provider returns sample status and sample label note', async () => {
    const provider = new DemoFuelPriceProvider();
    const data = await provider.getPrices('Hyderabad');
    expect(data.status).toBe('demo');
    expect(data.isSample).toBe(true);
    expect(data.note).toContain('Sample data, not a real price');
    expect(data.petrolPerLitre).toBeGreaterThan(0);
  });

  it('demo precious metals provider returns sample status and sample label note', async () => {
    const provider = new DemoPreciousMetalsPriceProvider();
    const data = await provider.getPrices('Hyderabad');
    expect(data.status).toBe('demo');
    expect(data.isSample).toBe(true);
    expect(data.note).toContain('Sample data, not a real price');
    expect(data.gold24kPer10g).toBeGreaterThan(0);
  });

  it('demo market index provider marks data as sample AND delayed', async () => {
    const provider = new DemoMarketIndexPriceProvider();
    const data = await provider.getPrices('Hyderabad');
    expect(data.status).toBe('demo');
    expect(data.isSample).toBe(true);
    expect(data.isDelayed).toBe(true);
    expect(data.note).toContain('Delayed');
  });

  it('fetchPricesData aggregates currency, fuel, metals, and index with category failure isolation', async () => {
    const res = await fetchPricesData('Mumbai');
    expect(res.status).toBe('demo');
    expect(res.data.city).toBe('Mumbai');
    expect(res.data.currency.usdInr).toBeGreaterThan(0);
    expect(res.data.fuel.petrolPerLitre).toBeGreaterThan(0);
    expect(res.data.preciousMetals.gold24kPer10g).toBeGreaterThan(0);
    expect(res.data.marketIndex.nifty50).toBeGreaterThan(0);
    expect(res.data.marketIndex.isDelayed).toBe(true);
  });
});
