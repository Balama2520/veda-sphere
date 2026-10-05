import { describe, it, expect } from 'vitest';
import { calculateSubIndex, getAqiCategory, calculateCpcbAqi } from '../src/services/aqi.js';

describe('CPCB AQI Calculation Service', () => {
  describe('calculateSubIndex & Band Boundaries', () => {
    it('calculates PM2.5 boundary sub-indices correctly', () => {
      expect(calculateSubIndex(0, [
        { bpLo: 0, bpHi: 30, iLo: 0, iHi: 50 },
        { bpLo: 31, bpHi: 60, iLo: 51, iHi: 100 },
        { bpLo: 61, bpHi: 90, iLo: 101, iHi: 200 },
        { bpLo: 91, bpHi: 120, iLo: 201, iHi: 300 },
        { bpLo: 121, bpHi: 250, iLo: 301, iHi: 400 },
        { bpLo: 251, bpHi: 380, iLo: 401, iHi: 500 },
      ])).toBe(0);

      expect(calculateSubIndex(30, [
        { bpLo: 0, bpHi: 30, iLo: 0, iHi: 50 },
        { bpLo: 31, bpHi: 60, iLo: 51, iHi: 100 },
        { bpLo: 61, bpHi: 90, iLo: 101, iHi: 200 },
        { bpLo: 91, bpHi: 120, iLo: 201, iHi: 300 },
        { bpLo: 121, bpHi: 250, iLo: 301, iHi: 400 },
        { bpLo: 251, bpHi: 380, iLo: 401, iHi: 500 },
      ])).toBe(50);

      expect(calculateSubIndex(31, [
        { bpLo: 0, bpHi: 30, iLo: 0, iHi: 50 },
        { bpLo: 31, bpHi: 60, iLo: 51, iHi: 100 },
      ])).toBe(51);

      expect(calculateSubIndex(60, [
        { bpLo: 31, bpHi: 60, iLo: 51, iHi: 100 },
      ])).toBe(100);
    });

    it('handles negative or NaN input gracefully', () => {
      expect(calculateSubIndex(-10, [])).toBe(0);
      expect(calculateSubIndex(NaN, [])).toBe(0);
    });

    it('caps huge values at 500', () => {
      const pm25Series = Array(24).fill(600); // extreme pollution
      const result = calculateCpcbAqi({ pm25Series, pm10Series: Array(24).fill(700) });
      expect(result.aqi).toBe(500);
      expect(result.category).toBe('Severe');
    });
  });

  describe('getAqiCategory', () => {
    it('maps AQI values to exact CPCB categories', () => {
      expect(getAqiCategory(25)).toBe('Good');
      expect(getAqiCategory(50)).toBe('Good');
      expect(getAqiCategory(75)).toBe('Satisfactory');
      expect(getAqiCategory(100)).toBe('Satisfactory');
      expect(getAqiCategory(150)).toBe('Moderate');
      expect(getAqiCategory(200)).toBe('Moderate');
      expect(getAqiCategory(250)).toBe('Poor');
      expect(getAqiCategory(300)).toBe('Poor');
      expect(getAqiCategory(350)).toBe('Very Poor');
      expect(getAqiCategory(400)).toBe('Very Poor');
      expect(getAqiCategory(450)).toBe('Severe');
      expect(getAqiCategory(500)).toBe('Severe');
    });
  });

  describe('calculateCpcbAqi end-to-end', () => {
    it('uses 24h-average basis when >= 16 valid readings exist', () => {
      const pm25Series = Array(20).fill(25); // 20 valid readings
      const pm10Series = Array(20).fill(40);

      const result = calculateCpcbAqi({ pm25Series, pm10Series });
      expect(result.basis).toBe('24h-average');
      expect(result.category).toBe('Good');
    });

    it('uses latest-hour basis when < 16 valid readings exist', () => {
      const pm25Series = [null, null, null, null, null, 75]; // 1 valid reading
      const pm10Series = [null, null, null, null, null, 120];

      const result = calculateCpcbAqi({ pm25Series, pm10Series });
      expect(result.basis).toBe('latest-hour');
      expect(result.category).toBe('Moderate');
    });

    it('identifies dominant pollutant correctly', () => {
      // PM2.5 = 75 µg/m³ -> Moderate AQI ~148
      // PM10 = 300 µg/m³ -> Poor AQI ~250
      const pm25Series = Array(24).fill(75);
      const pm10Series = Array(24).fill(300);

      const result = calculateCpcbAqi({ pm25Series, pm10Series });
      expect(result.dominantPollutant).toBe('PM10');
      expect(result.category).toBe('Poor');
    });

    it('throws error when no pollutant data exists', () => {
      expect(() =>
        calculateCpcbAqi({ pm25Series: [null, null], pm10Series: [null, null] })
      ).toThrow('Insufficient pollutant data to calculate CPCB AQI');
    });
  });
});
