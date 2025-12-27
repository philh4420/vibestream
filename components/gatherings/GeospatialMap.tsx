
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Gathering } from '../../types';
import { ICONS } from '../../constants';

// --- SUB-COMPONENTS ---

// Fixes Leaflet rendering timing issues in dynamic layouts
const MapStabilizer = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

// Handles dynamic map movement when coordinates change
const MapController = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 15, { duration: 2, easeLinearity: 0.25 });
  }, [center, map]);
  return null;
};

// --- TYPES & PROPS ---

interface GeospatialMapProps {
  gathering: Gathering;
  organizerAvatar: string;
}

export const GeospatialMap: React.FC<GeospatialMapProps> = ({ gathering, organizerAvatar }) => {
  // Default Target: Central London (Fallback)
  const [position, setPosition] = useState<[number, number]>([51.505, -0.09]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoordinates = async () => {
      const primaryQuery = gathering.address?.trim();
      const secondaryQuery = gathering.location?.trim();
      
      if (!primaryQuery && !secondaryQuery) return;
      
      setIsGeocoding(true);
      setError(null);

      const performSearch = async (queryStr: string) => {
          try {
              // Using Nominatim (OpenStreetMap) - much better for street level precision than OpenMeteo
              const response = await fetch(
                  `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}&limit=1&addressdetails=1`,
                  {
                      headers: {
                          'Accept-Language': 'en-GB,en;q=0.9',
                      }
                  }
              );
              const data = await response.json();
              if (data && data.length > 0) {
                  return [parseFloat(data[0].lat), parseFloat(data[0].lon)] as [number, number];
              }
              return null;
          } catch (err) {
              console.error("Geocoding fetch error:", err);
              return null;
          }
      };

      // TACTICAL SEARCH SEQUENCE
      // 1. Try Full Physical Address (Most precise)
      let coords = primaryQuery ? await performSearch(primaryQuery) : null;

      // 2. If address fails, try location name
      if (!coords && secondaryQuery) {
          coords = await performSearch(secondaryQuery);
      }

      // 3. Last Ditch: Try to extract and search just the postcode if it's UK format
      if (!coords && primaryQuery) {
          const postcodeMatch = primaryQuery.match(/[A-Z]{1,2}[0-9][A-Z0-9]? [0-9][ABD-HJLNP-UW-Z]{2}/i);
          if (postcodeMatch) {
              coords = await performSearch(postcodeMatch[0]);
          }
      }

      if (coords) {
          setPosition(coords);
      } else {
          setError("COORDS_UNRESOLVED");
          console.warn("Geospatial: All geocoding tiers failed for query.");
      }
      
      setIsGeocoding(false);
    };

    fetchCoordinates();
  }, [gathering.location, gathering.address]);
  
  // High-Fidelity Custom Marker
  const techMarkerIcon = L.divIcon({
    className: 'bg-transparent border-none',
    html: `
      <div class="relative w-20 h-20 -ml-10 -mt-10 flex items-center justify-center group">
        <!-- Pulse Rings -->
        <div class="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
        <div class="absolute inset-4 bg-indigo-500/40 rounded-full animate-pulse"></div>
        
        <!-- Core Node -->
        <div class="relative w-12 h-12 bg-slate-900 rounded-full border-2 border-white shadow-[0_0_20px_rgba(79,70,229,0.5)] overflow-hidden z-10">
          <img src="${organizerAvatar}" class="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
        </div>
        
        <!-- Tactical Tag -->
        <div class="absolute -bottom-4 bg-indigo-600 text-white text-[8px] font-black px-2 py-0.5 rounded-sm uppercase tracking-widest shadow-lg border border-indigo-400 z-20">
          TARGET
        </div>
        
        <!-- Connecting Line -->
        <div class="absolute top-1/2 left-1/2 w-px h-8 bg-indigo-500 origin-top transform translate-y-6"></div>
        <div class="absolute bottom-[-1.5rem] left-1/2 w-2 h-2 bg-indigo-500 rounded-full -translate-x-1/2 shadow-[0_0_10px_#6366f1]"></div>
      </div>
    `,
    iconSize: [80, 80],
    iconAnchor: [40, 80],
    popupAnchor: [0, -70]
  });

  return (
    <div className="relative w-full h-[400px] rounded-[3rem] overflow-hidden shadow-2xl border border-white/20 group isolate bg-slate-900">
      
      {/* 1. MAP LAYER */}
      <MapContainer 
        center={position} 
        zoom={15} 
        scrollWheelZoom={false} 
        className="w-full h-full z-0 outline-none bg-slate-950"
        zoomControl={false}
        dragging={true}
      >
        <MapStabilizer />
        <MapController center={position} />
        
        {/* Professional Dark Matter Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains={['a','b','c','d']}
          maxZoom={20}
        />
        
        <Marker position={position} icon={techMarkerIcon}>
          <Popup className="tech-popup" closeButton={false}>
            <div className="p-1 min-w-[180px]">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest font-mono">SIGNAL_LOCKED</span>
                    <div className="flex gap-1">
                        <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                        <div className="w-1 h-1 bg-emerald-500/50 rounded-full" />
                    </div>
                </div>
                <p className="font-black text-xs text-white uppercase tracking-tight mb-0.5">{gathering.title}</p>
                <p className="text-[9px] font-mono text-slate-400 truncate">{gathering.address || gathering.location}</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* 2. TACTICAL OVERLAYS (HUD) */}
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 pointer-events-none z-[10] opacity-10" 
           style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      {/* Top Left: Status */}
      <div className="absolute top-6 left-6 z-[20] flex items-center gap-3">
        <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-lg">
           <div className="relative w-2 h-2">
              <div className={`absolute inset-0 rounded-full animate-ping opacity-75 ${isGeocoding ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
              <div className={`relative w-2 h-2 rounded-full ${isGeocoding ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
           </div>
           <span className="text-[9px] font-black text-white uppercase tracking-[0.25em] font-mono">
             {isGeocoding ? 'SCANNING_GRID...' : error ? 'COORDS_UNRESOLVED' : 'LIVE_SAT_FEED'}
           </span>
        </div>
      </div>

      {/* Bottom Left: Coordinates */}
      <div className="absolute bottom-6 left-6 z-[20] hidden md:block">
         <div className="flex flex-col gap-1 bg-black/40 backdrop-blur-md px-3 py-2 rounded-xl border border-white/5">
            <p className="text-[8px] font-mono text-slate-300 font-bold uppercase tracking-widest">LAT: {position[0].toFixed(4)}° N</p>
            <p className="text-[8px] font-mono text-slate-300 font-bold uppercase tracking-widest">LNG: {position[1].toFixed(4)}° W</p>
         </div>
      </div>

      {/* Bottom Right: Action */}
      <div className="absolute bottom-6 right-6 z-[20]">
         <a 
           href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gathering.address || gathering.location)}`} 
           target="_blank" 
           rel="noopener noreferrer"
           className="flex items-center gap-3 px-6 py-3 bg-white text-slate-950 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:bg-indigo-50 transition-all group"
         >
           <div className="group-hover:rotate-12 transition-transform duration-300">
             <ICONS.Globe />
           </div>
           INITIATE_ROUTE
         </a>
      </div>

      {/* 3. CSS INJECTION FOR LEAFLET OVERRIDES */}
      <style dangerouslySetInnerHTML={{ __html: `
        .leaflet-container {
            font-family: 'JetBrains Mono', monospace;
            background: #020617;
        }
        
        /* Hide Default Controls */
        .leaflet-control-container .leaflet-top,
        .leaflet-control-container .leaflet-bottom {
            display: none !important;
        }

        /* Custom Popup Styling */
        .leaflet-popup-content-wrapper {
            background: rgba(15, 23, 42, 0.9);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 1rem;
            color: white;
            box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5);
            padding: 0;
        }
        .leaflet-popup-content {
            margin: 0.8rem 1rem;
            width: auto !important;
        }
        .leaflet-popup-tip {
            background: rgba(15, 23, 42, 0.9);
        }
      `}} />
    </div>
  );
};
