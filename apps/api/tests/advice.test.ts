import { describe, it, expect } from 'vitest';
import { getWeatherAdvice, getAqiAdvice } from '../src/services/advice.js';

describe('Weather & AQI Advice Service', () => {
  describe('getWeatherAdvice', () => {
    it('rain >= 50% → caution severity and umbrella text', () => {
      const advice = getWeatherAdvice({ rainChancePercent: 65, todayMaxC: 32 });
      expect(advice.text).toBe('Rain likely today. Take an umbrella.');
      expect(advice.severity).toBe('caution');
    });

    it('rain 50% boundary → caution', () => {
      const advice = getWeatherAdvice({ rainChancePercent: 50, todayMaxC: 28 });
      expect(advice.severity).toBe('caution');
    });

    it('rain 20–49% → info and small-chance text', () => {
      const advice = getWeatherAdvice({ rainChancePercent: 30, todayMaxC: 30 });
      expect(advice.text).toBe('Small chance of rain. You may want an umbrella.');
      expect(advice.severity).toBe('info');
    });

    it('rain 19% (just below caution) does not trigger rain advice', () => {
      const advice = getWeatherAdvice({ rainChancePercent: 19, todayMaxC: 28 });
      expect(advice.text).not.toContain('rain');
    });

    it('todayMax >= 38°C, low rain → warning and very-hot text', () => {
      const advice = getWeatherAdvice({ rainChancePercent: 10, todayMaxC: 40 });
      expect(advice.text).toBe('Very hot today. Drink water and avoid midday sun.');
      expect(advice.severity).toBe('warning');
    });

    it('todayMax 38°C boundary → warning', () => {
      const advice = getWeatherAdvice({ rainChancePercent: 0, todayMaxC: 38 });
      expect(advice.severity).toBe('warning');
    });

    it('todayMax 32–37°C → caution and warm text', () => {
      const advice = getWeatherAdvice({ rainChancePercent: 5, todayMaxC: 35 });
      expect(advice.text).toBe('Warm today. Stay hydrated.');
      expect(advice.severity).toBe('caution');
    });

    it('todayMax 32°C boundary → warm band', () => {
      const advice = getWeatherAdvice({ rainChancePercent: 0, todayMaxC: 32 });
      expect(advice.text).toBe('Warm today. Stay hydrated.');
    });

    it('todayMax 31°C → comfortable/neutral text, info severity', () => {
      const advice = getWeatherAdvice({ rainChancePercent: 10, todayMaxC: 28 });
      expect(advice.text).toBe('Comfortable weather today. Good time to be outside.');
      expect(advice.severity).toBe('info');
      expect(advice.text).not.toContain('pleasant'); // must not say pleasant
    });

    it('rain takes priority over heat (rain 50% + todayMax 39°C → caution, rain text)', () => {
      const advice = getWeatherAdvice({ rainChancePercent: 55, todayMaxC: 39 });
      expect(advice.text).toContain('umbrella');
      expect(advice.severity).toBe('caution');
    });
  });

  describe('getAqiAdvice', () => {
    it('Good → info', () => {
      const a = getAqiAdvice('Good');
      expect(a.text).toBe('Air is clean. A good day to be outside.');
      expect(a.severity).toBe('info');
    });

    it('Satisfactory → info', () => {
      const a = getAqiAdvice('Satisfactory');
      expect(a.text).toContain('acceptable');
      expect(a.severity).toBe('info');
    });

    it('Moderate → caution', () => {
      const a = getAqiAdvice('Moderate');
      expect(a.text).toContain('limit long outdoor activity');
      expect(a.severity).toBe('caution');
    });

    it('Poor → warning', () => {
      expect(getAqiAdvice('Poor').severity).toBe('warning');
    });

    it('Very Poor → warning', () => {
      expect(getAqiAdvice('Very Poor').severity).toBe('warning');
    });

    it('Severe → warning', () => {
      expect(getAqiAdvice('Severe').severity).toBe('warning');
    });
  });
});
