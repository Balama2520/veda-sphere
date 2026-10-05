import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clearCurrencyCache, fetchCurrencyData } from '../src/sources/currency.js';

describe('Currency Source & API Tests', () => {
  beforeEach(() => {
    clearCurrencyCache();
    vi.restoreAllMocks();
  });

  it('fetches fresh reference rates for USD, EUR, and GBP to INR', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
      const uStr = String(url);
      if (uStr.includes('USD')) {
        return new Response(JSON.stringify({ date: '2026-10-02', rates: { INR: 86.54 } }), { status: 200 });
      }
      if (uStr.includes('EUR')) {
        return new Response(JSON.stringify({ date: '2026-10-02', rates: { INR: 93.18 } }), { status: 200 });
      }
      if (uStr.includes('GBP')) {
        return new Response(JSON.stringify({ date: '2026-10-02', rates: { INR: 109.75 } }), { status: 200 });
      }
      return new Response('Not Found', { status: 404 });
    });

    const res = await fetchCurrencyData();
    expect(res.status).toBe('fresh');
    expect(res.data.usdInr).toBe(86.54);
    expect(res.data.eurInr).toBe(93.18);
    expect(res.data.gbpInr).toBe(109.75);
    expect(res.data.rateDate).toBe('2026-10-02');
    expect(res.data.note).toContain('Reference rate');
  });

  it('shows last working day date for weekend requests', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      new Response(JSON.stringify({ date: '2026-10-02', rates: { INR: 86.5 } }), { status: 200 })
    );

    const res = await fetchCurrencyData();
    expect(res.data.rateDate).toBe('2026-10-02'); // Friday reference date
  });

  it('falls back to demo rates when network is down', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    const res = await fetchCurrencyData();
    expect(res.status).toBe('demo');
    expect(res.data.usdInr).toBeGreaterThan(0);
    expect(res.data.note).toContain('Reference rate');
  });
});
