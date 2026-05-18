export type WeatherCondition = 'sunny' | 'rainy' | 'cloudy' | 'snow' | 'overcast';

export interface WeatherDay {
  date: string;
  condition: WeatherCondition;
  tempHigh: number;
  tempLow: number;
  humidity: number;
  windSpeed: number;
  icon: string;
  description: string;
  rainProbability: number;
}

export interface WeatherData {
  location: string;
  current: WeatherDay;
  forecast: WeatherDay[];
}
