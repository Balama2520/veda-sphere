import { describe, it, expect } from 'vitest';
import { getWeatherAdvice } from '../src/services/advice.js';

describe('Weather Advice Service', () => {
  it('returns umbrella advice when rainChancePercent >= 50', () => {
    const advice = getWeatherAdvice({ rainChancePercent: 65, todayMaxC: 32 });
    expect(advice).toBe('Rain likely today. Take an umbrella.');
  });

  it('returns small chance of rain advice when rainChancePercent is between 20 and 49', () => {
    const advice = getWeatherAdvice({ rainChancePercent: 30, todayMaxC: 30 });
    expect(advice).toBe('Small chance of rain.');
  });

  it('returns heat advice when todayMaxC >= 38 and low rain chance', () => {
    const advice = getWeatherAdvice({ rainChancePercent: 10, todayMaxC: 40 });
    expect(advice).toBe('Very hot. Drink water and avoid midday sun.');
  });

  it('returns neutral pleasant weather advice otherwise', () => {
    const advice = getWeatherAdvice({ rainChancePercent: 10, todayMaxC: 28 });
    expect(advice).toBe('Pleasant weather today. Enjoy your day.');
  });
});
