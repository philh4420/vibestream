
import { CONFIG } from './config';
import { WeatherInfo } from '../types';

export const fetchWeather = async (params: { query?: string; coords?: { lat: number; lon: number } }): Promise<WeatherInfo | null> => {
  const apiKey = CONFIG.WEATHER.apiKey;
  if (!apiKey || apiKey === 'undefined') {
    console.debug('Weather API Key missing - skipping atmospheric sync');
    return null;
  }

  try {
    let url = '';
    
    if (params.coords && params.coords.lat !== undefined && params.coords.lon !== undefined) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${params.coords.lat}&lon=${params.coords.lon}&units=metric&appid=${apiKey}`;
    } else {
      let query = (params.query || 'London').trim();
      
      // Sanitization: Filter out system/fictional locations to prevent API 404s
      const invalidLocations = ['grid node', 'earth', 'nowhere', 'unknown', 'system', 'cybertron', 'mars', 'node'];
      const normalizedQuery = query.toLowerCase();
      
      if (
        !query || 
        invalidLocations.some(loc => normalizedQuery.includes(loc)) || 
        normalizedQuery === 'united kingdom' || 
        normalizedQuery === 'uk'
      ) {
        query = 'London';
      }

      // Address Cleaning: If query contains commas (e.g. "Street, City, Country"), 
      // strip the street part to avoid 404s from OpenWeatherMap which prefers "City, Country".
      if (query.includes(',')) {
        const parts = query.split(',').map(p => p.trim()).filter(Boolean);
        // If we have 3 or more parts (e.g. Street, City, UK), take the last 2 (City, UK)
        // If we have 2 parts (City, UK), keep as is.
        if (parts.length > 2) {
           query = parts.slice(-2).join(',');
        }
      }
      
      url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&units=metric&appid=${apiKey}`;
    }

    const response = await fetch(url);
    
    if (response.status === 404) {
      console.debug('Weather station not found for location, retrying with default node.');
      // Silent fallback if specific location fails
      if (!url.includes('London')) {
         const fallbackUrl = `https://api.openweathermap.org/data/2.5/weather?q=London&units=metric&appid=${apiKey}`;
         const fallbackResponse = await fetch(fallbackUrl);
         if (fallbackResponse.ok) {
            const data = await fallbackResponse.json();
            if (data.weather && data.weather[0]) {
               return {
                  temp: Math.round(data.main.temp),
                  feelsLike: Math.round(data.main.feels_like),
                  humidity: data.main.humidity,
                  condition: data.weather[0].main,
                  icon: data.weather[0].icon
               };
            }
         }
      }
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn('Weather API error:', errorData.message || response.statusText);
      return null;
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
    console.debug('Atmospheric sync bypassed:', error instanceof Error ? error.message : 'Network error');
    return null;
  }
};
