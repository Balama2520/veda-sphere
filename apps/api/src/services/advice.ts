import { AqiCategory } from './aqi.js';

export type AdviceSeverity = 'info' | 'caution' | 'warning';

export interface WeatherAdviceInput {
  rainChancePercent: number;
  todayMaxC: number;
}

export interface AqiAdviceResult {
  text: string;
  severity: AdviceSeverity;
}

export function getWeatherAdvice(input: WeatherAdviceInput): { text: string; severity: AdviceSeverity } {
  const { rainChancePercent, todayMaxC } = input;

  if (rainChancePercent >= 50) {
    return {
      text: 'Rain likely today. Take an umbrella.',
      severity: 'caution', // factual reminder, not a danger warning
    };
  }

  if (rainChancePercent >= 20) {
    return {
      text: 'Small chance of rain. You may want an umbrella.',
      severity: 'info',
    };
  }

  if (todayMaxC >= 38) {
    return {
      text: 'Very hot today. Drink water and avoid midday sun.',
      severity: 'warning',
    };
  }

  if (todayMaxC >= 32) {
    return {
      text: 'Warm today. Stay hydrated.',
      severity: 'caution',
    };
  }

  // Only say "pleasant" if it is genuinely not hot
  return {
    text: 'Comfortable weather today. Good time to be outside.',
    severity: 'info',
  };
}

export function getAqiAdvice(category: AqiCategory): AqiAdviceResult {
  switch (category) {
    case 'Good':
      return {
        text: 'Air is clean. A good day to be outside.',
        severity: 'info',
      };
    case 'Satisfactory':
      return {
        text: 'Air is acceptable. Very sensitive people may notice mild effects.',
        severity: 'info',
      };
    case 'Moderate':
      return {
        text: 'Air is moderate. People with asthma, children and older adults should limit long outdoor activity.',
        severity: 'caution',
      };
    case 'Poor':
      return {
        text: 'Air is poor. Limit time outdoors and consider a mask.',
        severity: 'warning',
      };
    case 'Very Poor':
      return {
        text: 'Air is very poor. Avoid outdoor exertion and wear a mask if you must go out.',
        severity: 'warning',
      };
    case 'Severe':
      return {
        text: 'Air is severe. Stay indoors where possible and avoid outdoor exercise.',
        severity: 'warning',
      };
  }
}
