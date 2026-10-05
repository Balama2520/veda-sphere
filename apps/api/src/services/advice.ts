export interface WeatherAdviceInput {
  rainChancePercent: number;
  todayMaxC: number;
}

export function getWeatherAdvice(input: WeatherAdviceInput): string {
  const { rainChancePercent, todayMaxC } = input;

  if (rainChancePercent >= 50) {
    return 'Rain likely today. Take an umbrella.';
  }

  if (rainChancePercent >= 20) {
    return 'Small chance of rain.';
  }

  if (todayMaxC >= 38) {
    return 'Very hot. Drink water and avoid midday sun.';
  }

  return 'Pleasant weather today. Enjoy your day.';
}
