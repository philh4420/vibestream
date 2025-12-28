
import React, { useState, useEffect } from 'react';
import { formatUrl } from '../../lib/textUtils';

interface LinkPreviewProps {
  url: string;
  compact?: boolean;
}

interface MetaData {
  title: string;
  description: string;
  image: { url: string } | null;
  logo: { url: string } | null;
  publisher: string;
}

export const LinkPreview: React.FC<LinkPreviewProps> = ({ url, compact = false }) => {
  const [data, setData] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(false);
      try {
        // Using Microlink API for frontend-only OG scraping
        const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
        const json = await response.json();
        
        if (json.status === 'success' && isMounted) {
          setData(json.data);
        } else {
          setError(true);
        }
      } catch (err) {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [url]);

  if (error || (!loading && !data)) return null;

  if (loading) {
    return (
      <div className={`mt-3 w-full rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700 overflow-hidden ${compact ? 'h-24' : 'h-64'}`}>
        {!compact && <div className="h-40 bg-slate-200 dark:bg-slate-700/50" />}
        <div className="p-4 space-y-2">
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer" 
      className={`block mt-3 group overflow-hidden rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-lg hover:-translate-y-0.5 ${compact ? 'flex' : ''}`}
    >
      {/* Image Section */}
      {data.image && (
        <div className={`relative overflow-hidden bg-slate-200 dark:bg-slate-800 ${compact ? 'w-24 shrink-0' : 'w-full h-40'}`}>
          <img 
            src={data.image.url} 
            alt={data.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          />
          {!compact && (
             <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-60" />
          )}
        </div>
      )}

      {/* Content Section */}
      <div className={`p-4 flex flex-col justify-center min-w-0 ${compact ? 'flex-1 py-2' : ''}`}>
        <div className="flex items-center gap-2 mb-1.5 opacity-80">
          {data.logo && (
            <img src={data.logo.url} className="w-3 h-3 rounded-full" alt="" />
          )}
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 font-mono truncate">
            {data.publisher || formatUrl(url)}
          </span>
        </div>
        
        <h4 className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight mb-1 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {data.title}
        </h4>
        
        {data.description && !compact && (
          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium">
            {data.description}
          </p>
        )}
      </div>
    </a>
  );
};
