
import { CONFIG } from './config';
import { WeatherInfo } from '../types';

export const fetchWeather = async (params: { query?: string; coords?: { lat: number; lon: number } }): Promise<WeatherInfo | null> => {
  const apiKey = CONFIG.WEATHER.apiKey;
  if (!apiKey || apiKey === 'undefined') {
    console.debug('Weather API Key missing - skipping atmospheric sync');
    return null;
  }

  const getUrl = (q: string) => `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(q)}&units=metric&appid=${apiKey}`;

  try {
    let url = '';
    let isCoords = false;
    
    if (params.coords && params.coords.lat !== undefined && params.coords.lon !== undefined) {
      url = `https://api.openweathermap.org/data/2.5/weather?lat=${params.coords.lat}&lon=${params.coords.lon}&units=metric&appid=${apiKey}`;
      isCoords = true;
    } else {
      let query = (params.query || 'London').trim();
      // Handle generic UK queries to focus on London for more accurate weather responses
      if (!query || query.toLowerCase() === 'united kingdom' || query.toLowerCase() === 'uk') {
        query = 'London';
      }
      url = getUrl(query);
    }

    let response = await fetch(url);
    
    // FALLBACK PROTOCOL: If specific node not found (404), broaden search radius
    if (response.status === 404 && !isCoords) {
      console.warn('Weather node unreachable, rerouting to regional sector...');
      
      // Attempt 1: If query has comma (e.g. "Park Street, UK"), try the region ("UK" -> "London")
      const originalQuery = params.query || '';
      if (originalQuery.includes(',')) {
         const parts = originalQuery.split(',');
         const region = parts[parts.length - 1].trim().toLowerCase();
         
         // If region is UK or similar, map to London, otherwise try the region name itself
         const fallbackQuery = (region === 'uk' || region === 'united kingdom') ? 'London' : region;
         
         if (fallbackQuery && fallbackQuery !== originalQuery.toLowerCase()) {
            response = await fetch(getUrl(fallbackQuery));
         }
      }

      // Attempt 2: Ultimate Fallback to Citadel Central (London) if still failing
      if (response.status === 404 || !response.ok) {
         response = await fetch(getUrl('London'));
      }
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
