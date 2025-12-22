
import React from 'react';
import { WeatherInfo } from '../../types';

interface AtmosphericBackgroundProps {
  weather: WeatherInfo | null;
  children: React.ReactNode;
}

export const AtmosphericBackground: React.FC<AtmosphericBackgroundProps> = ({ weather, children }) => {
  const condition = weather?.condition?.toLowerCase() || 'default';
  
  const getAtmosphericStyle = () => {
    // Standard OpenWeather Condition Mapping 2026
    if (condition.includes('thunderstorm')) return 'atmos-thunderstorm';
    if (condition.includes('drizzle')) return 'atmos-drizzle';
    if (condition.includes('rain')) return 'atmos-rain';
    if (condition.includes('snow')) return 'atmos-snow';
    if (condition.includes('clear')) return 'atmos-clear';
    if (condition.includes('clouds')) return 'atmos-clouds';
    if (['mist', 'smoke', 'haze', 'fog'].some(c => condition.includes(c))) return 'atmos-mist';
    if (['dust', 'sand', 'ash'].some(c => condition.includes(c))) return 'atmos-dust';
    if (['squall', 'tornado'].some(c => condition.includes(c))) return 'atmos-extreme';
    return 'atmos-default';
  };

  const styleClass = getAtmosphericStyle();

  return (
    <div className={`relative w-full h-full flex flex-col overflow-hidden transition-all duration-1000 ${styleClass}`}>
      {/* Dynamic Visual Layers */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Base Neural Gradient Layer - Primary Atmosphere Color */}
        <div className="absolute inset-0 bg-atmosphere-base opacity-100 transition-colors duration-1000" />
        
        {/* UK Condensation Layer (Rain/Drizzle/Storm) */}
        {(condition.includes('rain') || condition.includes('storm') || condition.includes('drizzle')) && (
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=2000')] bg-cover mix-blend-soft-light opacity-20 animate-pulse-slow" />
        )}
        
        {/* Solar Flare Layer (Clear/Sunny) */}
        {condition.includes('clear') && (
          <div className="absolute -top-1/4 -right-1/4 w-full h-full bg-gradient-radial from-amber-400/20 to-transparent blur-[140px] animate-float-slow" />
        )}

        {/* Crystalline Layer (Snow) */}
        {condition.includes('snow') && (
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] opacity-40" />
        )}

        {/* Volumetric Layer (Mist/Fog/Haze) */}
        {['mist', 'fog', 'haze'].some(c => condition.includes(c)) && (
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white/10 backdrop-blur-xl animate-drift-slow" />
        )}

        {/* Neural Grid Noise (2026 Refractive Texture) */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Content Interface Container */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {children}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        /* OKLCH Professional Palette 2026 */
        .atmos-thunderstorm .bg-atmosphere-base { background: oklch(0.12 0.03 270); }
        .atmos-rain .bg-atmosphere-base { background: oklch(0.15 0.05 260); }
        .atmos-drizzle .bg-atmosphere-base { background: oklch(0.45 0.02 240); }
        .atmos-snow .bg-atmosphere-base { background: oklch(0.98 0.005 200); }
        .atmos-clear .bg-atmosphere-base { background: oklch(0.98 0.01 80); }
        .atmos-clouds .bg-atmosphere-base { background: oklch(0.92 0.01 240); }
        .atmos-mist .bg-atmosphere-base { background: oklch(0.85 0.01 220); }
        .atmos-dust .bg-atmosphere-base { background: oklch(0.8 0.03 60); }
        .atmos-extreme .bg-atmosphere-base { background: oklch(0.1 0.01 0); }
        .atmos-default .bg-atmosphere-base { background: oklch(1 0 0); }

        .bg-gradient-radial { background-image: radial-gradient(var(--tw-gradient-stops)); }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.25; }
        }
        .animate-pulse-slow { animation: pulse-slow 10s ease-in-out infinite; }
        
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -30px) scale(1.15); }
        }
        .animate-float-slow { animation: float-slow 20s ease-in-out infinite; }

        @keyframes drift-slow {
          0% { transform: translateX(-5%); }
          100% { transform: translateX(5%); }
        }
        .animate-drift-slow { animation: drift-slow 15s ease-in-out infinite alternate; }

        /* Smooth UI adaptation for dark backgrounds */
        .atmos-thunderstorm, .atmos-rain, .atmos-extreme { color-scheme: dark; }
        .atmos-clear, .atmos-snow, .atmos-clouds, .atmos-mist { color-scheme: light; }
      `}} />
    </div>
  );
};
