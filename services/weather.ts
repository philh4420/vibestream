
import { CONFIG } from './config';
import { WeatherInfo } from '../types';

export const fetchWeather = async (params: { query?: string; coords?: { lat: number; lon: number } }): Promise<WeatherInfo | null> => {
  const apiKey = CONFIG.WEATHER.apiKey;
  if (!apiKey) return null;

  try {
    let url = '';
    
    if (params.coords) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${params.coords.lat}&lon=${params.coords.lon}&units=metric&appid=${apiKey}`;
    } else {
      let query = (params.query || 'London').trim();
      if (!query || query.toLowerCase() === 'united kingdom' || query.toLowerCase() === 'uk') {
        query = 'London';
      }
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&units=metric&appid=${apiKey}`;
    }

    const response = await fetch(url);
    
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Weather fetch failed');
    }
    
    const data = await response.json();
    if (!data.weather || !data.weather[0]) return null;

    return {
      temp: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      condition: data.weather[0].main,
      icon: data.weather[0].icon
    };
  } catch (error) {
    console.debug('Atmospheric sync bypassed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
};
