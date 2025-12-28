
export const extractUrls = (text: string): string[] => {
  if (!text) return [];
  // Regex to detect URLs (http/https)
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches ? matches : [];
};

export const formatUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace('www.', '');
  } catch (e) {
    return url;
  }
};
