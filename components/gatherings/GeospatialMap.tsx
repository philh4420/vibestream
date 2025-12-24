
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Gathering } from '../../types';
import { ICONS } from '../../constants';

// Fix for default Leaflet icons in React
const iconPerson = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconRetinaUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconAnchor: [20, 40],
    popupAnchor: [0, -35],
    iconSize: [40, 40],
    className: 'leaflet-div-icon'
});

interface GeospatialMapProps {
  gathering: Gathering;
  organizerAvatar: string;
}

export const GeospatialMap: React.FC<GeospatialMapProps> = ({ gathering, organizerAvatar }) => {
  // Default coordinates (London) if no geodata parsing logic exists yet
  // In a real app, we would Geocode the gathering.location string
  const defaultPosition: [number, number] = [51.505, -0.09];
  
  // Custom marker using the organizer's avatar
  const customIcon = L.divIcon({
    className: 'custom-map-marker',
    html: `<div class="w-12 h-12 rounded-full border-4 border-white shadow-2xl overflow-hidden relative">
            <img src="${organizerAvatar}" class="w-full h-full object-cover" />
            <div class="absolute inset-0 ring-2 ring-indigo-500 rounded-full"></div>
           </div>
           <div class="w-4 h-4 bg-indigo-600 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 -z-10"></div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 54], // Point of the icon which will correspond to marker's location
    popupAnchor: [0, -50]
  });

  return (
    <div className="relative w-full h-[350px] rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20 group z-0">
      
      {/* Map Interface */}
      <MapContainer 
        center={defaultPosition} 
        zoom={13} 
        scrollWheelZoom={false} 
        className="w-full h-full z-0"
        zoomControl={false}
      >
        {/* Dark Matter Tiles for Cyberpunk Aesthetic */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <Marker position={defaultPosition} icon={customIcon}>
          <Popup className="custom-popup">
            <div className="text-center">
                <p className="font-black text-xs uppercase tracking-widest">{gathering.title}</p>
                <p className="text-[10px] font-mono text-slate-500">{gathering.location}</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Overlay UI */}
      <div className="absolute top-4 left-4 z-[400] bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
        <span className="text-[9px] font-black text-white uppercase tracking-[0.2em] font-mono">Live_Telemetry</span>
      </div>

      <div className="absolute bottom-4 right-4 z-[400]">
         <a 
           href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gathering.location)}`} 
           target="_blank" 
           rel="noopener noreferrer"
           className="px-6 py-3 bg-white text-slate-900 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2"
         >
           <ICONS.Globe />
           Open_Sat_View
         </a>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .leaflet-div-icon {
            background: transparent;
            border: none;
        }
        .leaflet-popup-content-wrapper {
            border-radius: 1rem;
            padding: 0.5rem;
            font-family: 'Inter', sans-serif;
        }
      `}} />
    </div>
  );
};
