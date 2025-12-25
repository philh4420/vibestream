
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
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534274988757-a28bf1f539cf?q=80&w=2000')] bg-cover mix-blend-soft-light opacity-[0.08] animate-pulse-slow" />
        )}
        
        {/* Solar Flare Layer (Clear/Sunny) */}
        {condition.includes('clear') && (
          <div className="absolute -top-1/4 -right-1/4 w-full h-full bg-gradient-radial from-amber-400/10 to-transparent blur-[140px] animate-float-slow" />
        )}

        {/* Crystalline Layer (Snow) */}
        {condition.includes('snow') && (
          <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] opacity-20" />
        )}

        {/* Volumetric Layer (Mist/Fog/Haze) */}
        {['mist', 'fog', 'haze'].some(c => condition.includes(c)) && (
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-white/5 backdrop-blur-md animate-drift-slow" />
        )}

        {/* Neural Grid Noise (2026 Refractive Texture) */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay" />
      </div>

      {/* Content Interface Container */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {children}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        /* OKLCH Professional Palette 2026 - Adjusted for Global Backgrounds */
        .atmos-thunderstorm .bg-atmosphere-base { background: linear-gradient(180deg, oklch(0.15 0.02 260), oklch(0.2 0.02 260)); }
        
        /* Light Mode Weather */
        .atmos-rain .bg-atmosphere-base { background: linear-gradient(180deg, oklch(0.92 0.01 240), oklch(0.88 0.02 240)); }
        .atmos-drizzle .bg-atmosphere-base { background: linear-gradient(180deg, oklch(0.95 0.01 240), oklch(0.92 0.01 240)); }
        .atmos-snow .bg-atmosphere-base { background: linear-gradient(180deg, oklch(0.99 0.005 200), oklch(0.97 0.01 200)); }
        .atmos-clear .bg-atmosphere-base { background: linear-gradient(180deg, oklch(0.99 0.01 80), oklch(0.97 0.02 90)); }
        .atmos-clouds .bg-atmosphere-base { background: linear-gradient(180deg, oklch(0.98 0.005 240), oklch(0.95 0.01 240)); }
        .atmos-mist .bg-atmosphere-base { background: linear-gradient(180deg, oklch(0.96 0.01 220), oklch(0.94 0.01 220)); }
        .atmos-dust .bg-atmosphere-base { background: linear-gradient(180deg, oklch(0.92 0.02 60), oklch(0.88 0.03 60)); }
        .atmos-extreme .bg-atmosphere-base { background: linear-gradient(180deg, oklch(0.1 0.01 0), oklch(0.2 0.02 10)); }
        
        /* Default uses CSS Variable to respect System Theme */
        .atmos-default .bg-atmosphere-base { background: var(--bg-main); }

        /* Dark Mode Overrides for Weather Conditions */
        html.dark .atmos-rain .bg-atmosphere-base { background: linear-gradient(180deg, #0f172a, #1e293b); }
        html.dark .atmos-drizzle .bg-atmosphere-base { background: linear-gradient(180deg, #0f172a, #1e293b); }
        html.dark .atmos-snow .bg-atmosphere-base { background: linear-gradient(180deg, #020617, #0f172a); }
        html.dark .atmos-clear .bg-atmosphere-base { background: linear-gradient(180deg, #020617, #0f172a); }
        html.dark .atmos-clouds .bg-atmosphere-base { background: linear-gradient(180deg, #0f172a, #1e293b); }
        html.dark .atmos-mist .bg-atmosphere-base { background: linear-gradient(180deg, #020617, #1e293b); }
        html.dark .atmos-dust .bg-atmosphere-base { background: linear-gradient(180deg, #2a1b0e, #1f150b); }

        .bg-gradient-radial { background-image: radial-gradient(var(--tw-gradient-stops)); }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.12; }
        }
        .animate-pulse-slow { animation: pulse-slow 12s ease-in-out infinite; }
        
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -40px) scale(1.1); }
        }
        .animate-float-slow { animation: float-slow 25s ease-in-out infinite; }

        @keyframes drift-slow {
          0% { transform: translateX(-2%); }
          100% { transform: translateX(2%); }
        }
        .animate-drift-slow { animation: drift-slow 20s ease-in-out infinite alternate; }

        /* Content adaptation */
        .atmos-thunderstorm, .atmos-extreme { color-scheme: dark; }
        .atmos-thunderstorm main, .atmos-extreme main { --text-main: oklch(0.95 0.01 240); }
      `}} />
    </div>
  );
};
