
import { CONFIG } from './config';
import { WeatherInfo } from '../types';

export const fetchWeather = async (params: { query?: string; coords?: { lat: number; lon: number } }): Promise<WeatherInfo | null> => {
  const apiKey = CONFIG.WEATHER.apiKey;
  if (!apiKey || apiKey === 'undefined') {
    console.debug('Weather API Key missing - skipping atmospheric sync');
    return null;
  }

  // Helper for direct weather fetch by lat/lon
  const getWeatherByCoords = (lat: number, lon: number) => 
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

  try {
    let lat: number | undefined;
    let lon: number | undefined;

    // 1. Use Coordinates if available (Highest Accuracy)
    if (params.coords && params.coords.lat !== undefined && params.coords.lon !== undefined) {
      lat = params.coords.lat;
      lon = params.coords.lon;
    } 
    // 2. Resolve Query via Geocoding API (Robust Standard)
    else if (params.query) {
      let query = params.query.trim();
      
      // Clean up generic queries to prevent ambiguity
      if (!query || ['united kingdom', 'uk', 'england', 'great britain'].includes(query.toLowerCase())) {
        query = 'London, GB';
      }

      // Normalization: OWM prefers 'GB' over 'UK' for accurate UK resolution
      query = query.replace(/, UK$/i, ', GB').replace(/, United Kingdom$/i, ', GB');

      // Call Geocoding API
      const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=1&appid=${apiKey}`);
      
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (Array.isArray(geoData) && geoData.length > 0) {
          lat = geoData[0].lat;
          lon = geoData[0].lon;
        } else {
           console.warn(`Geocoding returned no results for "${query}".`);
        }
      }
    }

    // 3. If we still don't have coords, try fallback logic (Legacy Search)
    // This catches edge cases where Geocoding might miss but the legacy endpoint somehow works, or serves as a final safety net.
    if (lat === undefined || lon === undefined) {
       if (params.query) {
          console.warn('Attempting legacy weather fetch fallback...');
          // Try direct weather fetch with original query
          const legacyRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(params.query)}&units=metric&appid=${apiKey}`);
          if (legacyRes.ok) {
             const data = await legacyRes.json();
             return mapResponseToWeatherInfo(data);
          }
       }
       
       // 4. Ultimate Fallback: London (Citadel Central)
       // Ensures the UI never breaks even if the location is completely invalid.
       console.warn('Weather location unresolved. Defaulting to Central Citadel (London).');
       const londonRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=London,GB&units=metric&appid=${apiKey}`);
       if (!londonRes.ok) return null;
       const data = await londonRes.json();
       return mapResponseToWeatherInfo(data);
    }

    // 5. Fetch Weather with resolved Coords
    const response = await fetch(getWeatherByCoords(lat, lon));
    if (!response.ok) {
      throw new Error(`Weather API Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return mapResponseToWeatherInfo(data);

  } catch (error) {
    console.debug('Atmospheric sync bypassed:', error instanceof Error ? error.message : 'Network error');
    return null;
  }
};

// Helper to map API response to internal type
const mapResponseToWeatherInfo = (data: any): WeatherInfo | null => {
  if (!data.weather || !data.weather[0]) return null;
  return {
    temp: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    humidity: data.main.humidity,
    condition: data.weather[0].main,
    icon: data.weather[0].icon
  };
};
