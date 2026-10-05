import { describe, it, expect } from 'vitest';
import { getWeatherAdvice, getAqiAdvice } from '../src/services/advice.js';

describe('Weather & AQI Advice Service', () => {
  describe('getWeatherAdvice', () => {
    it('returns umbrella advice with warning severity when rainChancePercent >= 50', () => {
      const advice = getWeatherAdvice({ rainChancePercent: 65, todayMaxC: 32 });
      expect(advice.text).toBe('Rain likely today. Take an umbrella.');
      expect(advice.severity).toBe('warning');
    });

    it('returns small chance of rain advice with info severity when rainChancePercent is between 20 and 49', () => {
      const advice = getWeatherAdvice({ rainChancePercent: 30, todayMaxC: 30 });
      expect(advice.text).toBe('Small chance of rain.');
      expect(advice.severity).toBe('info');
    });

    it('returns heat advice with warning severity when todayMaxC >= 38', () => {
      const advice = getWeatherAdvice({ rainChancePercent: 10, todayMaxC: 40 });
      expect(advice.text).toBe('Very hot. Drink water and avoid midday sun.');
      expect(advice.severity).toBe('warning');
    });

    it('returns pleasant weather advice with info severity otherwise', () => {
      const advice = getWeatherAdvice({ rainChancePercent: 10, todayMaxC: 28 });
      expect(advice.text).toBe('Pleasant weather today. Enjoy your day.');
      expect(advice.severity).toBe('info');
    });
  });

  describe('getAqiAdvice', () => {
    it('returns correct text and info severity for Good and Satisfactory categories', () => {
      const good = getAqiAdvice('Good');
      expect(good.text).toBe('Air is clean. A good day to be outside.');
      expect(good.severity).toBe('info');

      const satisfactory = getAqiAdvice('Satisfactory');
      expect(satisfactory.text).toBe('Air is acceptable. Very sensitive people may notice mild effects.');
      expect(satisfactory.severity).toBe('info');
    });

    it('returns caution severity for Moderate category', () => {
      const moderate = getAqiAdvice('Moderate');
      expect(moderate.text).toContain('limit long outdoor activity');
      expect(moderate.severity).toBe('caution');
    });

    it('returns warning severity for Poor, Very Poor, and Severe categories', () => {
      const poor = getAqiAdvice('Poor');
      expect(poor.severity).toBe('warning');

      const veryPoor = getAqiAdvice('Very Poor');
      expect(veryPoor.severity).toBe('warning');

      const severe = getAqiAdvice('Severe');
      expect(severe.severity).toBe('warning');
    });
  });
});
