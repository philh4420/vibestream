
export const extractUrls = (text: string): string[] => {
  if (!text) return [];
  
  // Strip HTML tags to ensure we don't match tag attributes or closing tags attached to URLs
  // Replacing with space ensures we don't concatenate words (e.g. "end</p><p>start").
  const cleanText = text.replace(/<[^>]*>/g, ' ');
  
  // Regex to detect URLs (http/https)
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = cleanText.match(urlRegex);
  
  if (!matches) return [];

  return matches.map(url => {
    // Remove common trailing punctuation that is not part of the URL
    // Removes: . , ; ! ? ) ] } " ' < > and HTML entities like &nbsp; if caught (though space replacement helps)
    return url.replace(/[.,;!?)\]}"'<>]+$/, "");
  });
};

export const formatUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace('www.', '');
  } catch (e) {
    return url;
  }
};
