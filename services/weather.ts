
import { CONFIG } from './config';
import { WeatherInfo } from '../types';

export const fetchWeather = async (location: string): Promise<WeatherInfo | null> => {
  const apiKey = CONFIG.WEATHER.apiKey;
  if (!apiKey) return null;

  try {
    // Use the location string to query OpenWeather
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&appid=${apiKey}`
    );
    
    if (!response.ok) throw new Error('Weather fetch failed');
    
    const data = await response.json();
    return {
      temp: Math.round(data.main.temp),
      condition: data.weather[0].main,
      icon: data.weather[0].icon
    };
  } catch (error) {
    console.warn('Weather sync interrupted:', error);
    return null;
  }
};
