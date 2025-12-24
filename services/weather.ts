
import { CONFIG } from './config';
import { WeatherInfo } from '../types';

const DEFAULT_WEATHER: WeatherInfo = {
  temp: 15,
  feelsLike: 14,
  humidity: 72,
  condition: 'Clouds',
  icon: '04d'
};

export const fetchWeather = async (params: { query?: string; coords?: { lat: number; lon: number } }): Promise<WeatherInfo | null> => {
  const apiKey = CONFIG.WEATHER.apiKey;
  // Fail gracefully if no key, but return default so UI doesn't break
  if (!apiKey || apiKey === 'undefined') {
    return DEFAULT_WEATHER;
  }

  // Helper: Fetch current weather by coordinates (most reliable)
  const getWeatherByCoords = async (lat: number, lon: number): Promise<WeatherInfo | null> => {
    try {
      const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
      if (!res.ok) return null;
      const data = await res.json();
      return mapResponseToWeatherInfo(data);
    } catch { return null; }
  };

  try {
    // STRATEGY 1: Coordinates provided directly
    if (params.coords && params.coords.lat !== undefined && params.coords.lon !== undefined) {
      const data = await getWeatherByCoords(params.coords.lat, params.coords.lon);
      if (data) return data;
    } 

    // STRATEGY 2: Text Query Resolution
    if (params.query) {
      let query = params.query.trim();
      
      // Fix generic UK queries
      if (['uk', 'united kingdom', 'england', 'gb'].includes(query.toLowerCase())) {
        query = 'London, GB';
      }
      
      // Normalize country code for better OWM compatibility
      query = query.replace(/, UK$/i, ', GB');

      // Attempt A: Direct Geocoding (Best for "City, Country")
      let geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${apiKey}`);
      let geoData = geoRes.ok ? await geoRes.json() : [];

      // Attempt B: Broad Search (If "Park Street, GB" fails, try "Park Street")
      if (!geoData.length && query.includes(',')) {
        const broadQuery = query.split(',')[0].trim();
        if (broadQuery) {
           geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(broadQuery)}&limit=1&appid=${apiKey}`);
           geoData = geoRes.ok ? await geoRes.json() : [];
        }
      }

      // If we found coordinates via Geocoding, use them
      if (geoData.length > 0) {
        const { lat, lon } = geoData[0];
        const weather = await getWeatherByCoords(lat, lon);
        if (weather) return weather;
      }

      // Attempt C: Legacy Weather Endpoint (Fallback for some edge case city names)
      const legacyRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&units=metric&appid=${apiKey}`);
      if (legacyRes.ok) {
        const data = await legacyRes.json();
        const weather = mapResponseToWeatherInfo(data);
        if (weather) return weather;
      }
    }

    // STRATEGY 3: Ultimate Fallback (London)
    // Ensures the app never has a "missing weather" state that could look broken
    const fallbackRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=London,GB&units=metric&appid=${apiKey}`);
    if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        return mapResponseToWeatherInfo(data) || DEFAULT_WEATHER;
    }

    return DEFAULT_WEATHER;

  } catch (error) {
    console.warn('Weather service disrupted, engaging backup atmosphere.');
    return DEFAULT_WEATHER;
  }
};

const mapResponseToWeatherInfo = (data: any): WeatherInfo | null => {
  if (!data || !data.weather || !data.weather[0]) return null;
  return {
    temp: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    condition: data.weather[0].main,
    icon: data.weather[0].icon
  };
};
