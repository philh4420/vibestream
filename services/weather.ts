
import { CONFIG } from './config';
import { WeatherInfo } from '../types';

export const fetchWeather = async (location: string): Promise<WeatherInfo | null> => {
  const apiKey = CONFIG.WEATHER.apiKey;
  if (!apiKey) return null;

  try {
    // Sanitize query: use specific city name if it's too broad like 'United Kingdom'
    let query = location.trim();
    if (!query || query.toLowerCase() === 'united kingdom' || query.toLowerCase() === 'uk') {
      query = 'London';
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&units=metric&appid=${apiKey}`
    );
    
    // Gracefully handle not found or API errors without crashing the profile view
    if (response.status === 404) {
      console.warn(`Weather sync: Location '${query}' not found by provider.`);
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
      condition: data.weather[0].main,
      icon: data.weather[0].icon
    };
  } catch (error) {
    // Silent failure for weather; UI will fallback to just showing the clock/node
    console.debug('Weather sync bypassed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
};
