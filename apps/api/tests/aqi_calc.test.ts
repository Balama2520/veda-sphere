import { describe, it, expect } from 'vitest';
import {
  calculateSubIndex,
  getAqiCategory,
  calculateCpcbAqi,
} from '../src/services/aqi.js';

// Shared breakpoint tables used by the service
const PM25_BPS = [
  { bpLo: 0,   bpHi: 30,  iLo: 0,   iHi: 50  },
  { bpLo: 31,  bpHi: 60,  iLo: 51,  iHi: 100 },
  { bpLo: 61,  bpHi: 90,  iLo: 101, iHi: 200 },
  { bpLo: 91,  bpHi: 120, iLo: 201, iHi: 300 },
  { bpLo: 121, bpHi: 250, iLo: 301, iHi: 400 },
  { bpLo: 251, bpHi: 380, iLo: 401, iHi: 500 },
];
const PM10_BPS = [
  { bpLo: 0,   bpHi: 50,  iLo: 0,   iHi: 50  },
  { bpLo: 51,  bpHi: 100, iLo: 51,  iHi: 100 },
  { bpLo: 101, bpHi: 250, iLo: 101, iHi: 200 },
  { bpLo: 251, bpHi: 350, iLo: 201, iHi: 300 },
  { bpLo: 351, bpHi: 430, iLo: 301, iHi: 400 },
  { bpLo: 431, bpHi: 510, iLo: 401, iHi: 500 },
];

describe('CPCB AQI Calculation Service', () => {
  // ── PM2.5 boundary table ─────────────────────────────────────────────────
  describe('PM2.5 band boundaries (µg/m³ → sub-index)', () => {
    const cases: [number, number][] = [
      // Good band (0-50 AQI, 0-30 µg/m³)
      [0,   0],
      [30,  50],
      // Satisfactory (51-100, 31-60)
      [31,  51],
      [60,  100],
      // Moderate (101-200, 61-90)
      [61,  101],
      [90,  200],
      // Poor (201-300, 91-120)
      [91,  201],
      [120, 300],
      // Very Poor (301-400, 121-250)
      [121, 301],
      [250, 400],
      // Severe (401-500, 251-380)
      [251, 401],
    ];
    cases.forEach(([conc, expected]) => {
      it(`PM2.5 ${conc} µg/m³ → sub-index ${expected}`, () => {
        expect(calculateSubIndex(conc, PM25_BPS)).toBe(expected);
      });
    });

    it('PM2.5 midpoint 45.5 µg/m³ (Good band) → ~75', () => {
      const si = calculateSubIndex(45.5, PM25_BPS);
      // Linear: (50-0)/(30-0)*(45.5-0)+0 = 75.8... → rounds to 76
      expect(si).toBeGreaterThanOrEqual(74);
      expect(si).toBeLessThanOrEqual(77);
    });
  });

  // ── PM10 boundary table ───────────────────────────────────────────────────
  describe('PM10 band boundaries (µg/m³ → sub-index)', () => {
    const cases: [number, number][] = [
      [0,   0],
      [50,  50],
      [51,  51],
      [100, 100],
      [101, 101],
      [250, 200],
      [251, 201],
      [350, 300],
      [351, 301],
      [430, 400],
      [431, 401],
    ];
    cases.forEach(([conc, expected]) => {
      it(`PM10 ${conc} µg/m³ → sub-index ${expected}`, () => {
        expect(calculateSubIndex(conc, PM10_BPS)).toBe(expected);
      });
    });

    it('PM10 midpoint 175.5 µg/m³ (Moderate band) → ~150', () => {
      const si = calculateSubIndex(175.5, PM10_BPS);
      expect(si).toBeGreaterThanOrEqual(148);
      expect(si).toBeLessThanOrEqual(152);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────────
  describe('Edge cases', () => {
    it('zero concentration → sub-index 0', () => {
      expect(calculateSubIndex(0, PM25_BPS)).toBe(0);
    });

    it('negative concentration → treated as 0 (returns 0)', () => {
      expect(calculateSubIndex(-10, PM25_BPS)).toBe(0);
    });

    it('NaN → returns 0', () => {
      expect(calculateSubIndex(NaN, PM25_BPS)).toBe(0);
    });

    it('value above Severe PM2.5 cap (600 µg/m³) → capped at 500', () => {
      expect(calculateSubIndex(600, PM25_BPS)).toBe(500);
    });

    it('value above Severe PM10 cap (600 µg/m³) → capped at 500', () => {
      expect(calculateSubIndex(600, PM10_BPS)).toBe(500);
    });
  });

  // ── getAqiCategory ────────────────────────────────────────────────────────
  describe('getAqiCategory', () => {
    const cases: [number, string][] = [
      [0,   'Good'],
      [25,  'Good'],
      [50,  'Good'],
      [51,  'Satisfactory'],
      [75,  'Satisfactory'],
      [100, 'Satisfactory'],
      [101, 'Moderate'],
      [150, 'Moderate'],
      [200, 'Moderate'],
      [201, 'Poor'],
      [250, 'Poor'],
      [300, 'Poor'],
      [301, 'Very Poor'],
      [350, 'Very Poor'],
      [400, 'Very Poor'],
      [401, 'Severe'],
      [450, 'Severe'],
      [500, 'Severe'],
    ];
    cases.forEach(([aqi, cat]) => {
      it(`AQI ${aqi} → ${cat}`, () => {
        expect(getAqiCategory(aqi)).toBe(cat);
      });
    });
  });

  // ── calculateCpcbAqi end-to-end ───────────────────────────────────────────
  describe('calculateCpcbAqi end-to-end', () => {
    it('uses 24h-average basis when >= 16 valid PM2.5 readings', () => {
      const result = calculateCpcbAqi({
        pm25Series: Array(20).fill(25),
        pm10Series: Array(20).fill(40),
      });
      expect(result.basis).toBe('24h-average');
      expect(result.category).toBe('Good');
    });

    it('uses latest-hour basis when < 16 valid readings', () => {
      const result = calculateCpcbAqi({
        pm25Series: [null, null, null, null, null, 75],
        pm10Series: [null, null, null, null, null, 120],
      });
      expect(result.basis).toBe('latest-hour');
      expect(result.category).toBe('Moderate');
    });

    it('identifies PM10 as dominant pollutant when its sub-index is higher', () => {
      // PM2.5=75 → ~148 (Moderate); PM10=300 → 250 (Poor)
      const result = calculateCpcbAqi({
        pm25Series: Array(24).fill(75),
        pm10Series: Array(24).fill(300),
      });
      expect(result.dominantPollutant).toBe('PM10');
      expect(result.category).toBe('Poor');
    });

    it('identifies PM2.5 as dominant when its sub-index is higher', () => {
      // PM2.5=200 → ~367 (Very Poor); PM10=50 → 50 (Good)
      const result = calculateCpcbAqi({
        pm25Series: Array(24).fill(200),
        pm10Series: Array(24).fill(50),
      });
      expect(result.dominantPollutant).toBe('PM2.5');
      expect(result.category).toBe('Very Poor');
    });

    it('handles all-null PM2.5 by using PM10 alone', () => {
      const result = calculateCpcbAqi({
        pm25Series: Array(24).fill(null),
        pm10Series: Array(24).fill(80),
      });
      expect(result.dominantPollutant).toBe('PM10');
      expect(result.subIndices.pm25).toBeNull();
    });

    it('handles all-null PM10 by using PM2.5 alone', () => {
      const result = calculateCpcbAqi({
        pm25Series: Array(24).fill(20),
        pm10Series: Array(24).fill(null),
      });
      expect(result.dominantPollutant).toBe('PM2.5');
      expect(result.subIndices.pm10).toBeNull();
    });

    it('throws error when both pollutants are null', () => {
      expect(() =>
        calculateCpcbAqi({ pm25Series: [null, null], pm10Series: [null, null] })
      ).toThrow('Insufficient pollutant data');
    });

    it('huge values (600 µg/m³) → AQI capped at 500, Severe', () => {
      const result = calculateCpcbAqi({
        pm25Series: Array(24).fill(600),
        pm10Series: Array(24).fill(700),
      });
      expect(result.aqi).toBe(500);
      expect(result.category).toBe('Severe');
    });

    it('interpolates midpoint correctly for PM2.5 Moderate band', () => {
      // PM2.5 midpoint: 75.5 µg/m³ inside 61-90 band (AQI 101-200)
      // Expected: ~(200-101)/(90-61)*(75.5-61)+101 = 101 + 99/29*14.5 ≈ 150.5 → 151
      const result = calculateCpcbAqi({
        pm25Series: Array(24).fill(75.5),
        pm10Series: Array(24).fill(0),
      });
      expect(result.subIndices.pm25).toBeGreaterThanOrEqual(148);
      expect(result.subIndices.pm25).toBeLessThanOrEqual(154);
    });
  });
});
