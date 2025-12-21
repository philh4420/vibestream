
import { CONFIG } from './config';

const BASE_URL = 'https://api.giphy.com/v1/gifs';

export interface GiphyGif {
  id: string;
  url: string;
  images: {
    fixed_height: {
      url: string;
    };
    original: {
      url: string;
    };
  };
  title: string;
}

export const fetchTrendingGifs = async (limit = 20): Promise<GiphyGif[]> => {
  const apiKey = CONFIG.GIPHY.apiKey;
  if (!apiKey) throw new Error("GIPHY_KEY_MISSING");

  const response = await fetch(`${BASE_URL}/trending?api_key=${apiKey}&limit=${limit}&rating=g`);
  const data = await response.json();
  return data.data;
};

export const searchGifs = async (query: string, limit = 20): Promise<GiphyGif[]> => {
  const apiKey = CONFIG.GIPHY.apiKey;
  if (!apiKey) throw new Error("GIPHY_KEY_MISSING");

  const response = await fetch(`${BASE_URL}/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=${limit}&rating=g&lang=en`);
  const data = await response.json();
  return data.data;
};
