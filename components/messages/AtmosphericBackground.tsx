
import React from 'react';
import { WeatherInfo } from '../../types';

interface AtmosphericBackgroundProps {
  weather: WeatherInfo | null;
  children: React.ReactNode;
}

export const AtmosphericBackground: React.FC<AtmosphericBackgroundProps> = ({ weather, children }) => {
  const condition = weather?.condition?.toLowerCase() || 'default';
  
  const getAtmosphericStyle = () => {
    if (condition.includes('rain') || condition.includes('drizzle')) return 'atmos-rain';
    if (condition.includes('sun') || condition.includes('clear')) return 'atmos-sun';
    if (condition.includes('cloud')) return 'atmos-cloud';
    if (condition.includes('storm') || condition.includes('thunder')) return 'atmos-storm';
    return 'atmos-default';
  };

  return (
    <div className={`relative w-full h-full flex flex-col overflow-hidden transition-all duration-1000 ${getAtmosphericStyle()}`}>
      {/* Dynamic Visual Layers */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Base Gradient Layer */}
        <div className="absolute inset-0 bg-atmosphere-base opacity-100 transition-colors duration-1000" />
        
        {/* Condensation Layer (Rain) */}
        {(condition.includes('rain') || condition.includes('storm')) && (
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=2000')] bg-cover mix-blend-soft-light opacity-30 animate-pulse-slow" />
        )}
        
        {/* Warm Glow (Sun) */}
        {(condition.includes('sun') || condition.includes('clear')) && (
          <div className="absolute top-0 right-0 w-[80vw] h-[80vh] bg-gradient-radial from-amber-400/20 to-transparent blur-[120px] animate-float-slow" />
        )}

        {/* Refractive Glass Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Content Interface */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {children}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .atmos-rain .bg-atmosphere-base { background: oklch(0.15 0.05 260); }
        .atmos-sun .bg-atmosphere-base { background: oklch(0.98 0.01 80); }
        .atmos-cloud .bg-atmosphere-base { background: oklch(0.95 0.02 240); }
        .atmos-storm .bg-atmosphere-base { background: oklch(0.1 0.02 280); }
        .atmos-default .bg-atmosphere-base { background: oklch(1 0 0); }

        .bg-gradient-radial { background-image: radial-gradient(var(--tw-gradient-stops)); }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
        .animate-pulse-slow { animation: pulse-slow 8s ease-in-out infinite; }
        
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(10px, -20px) scale(1.1); }
        }
        .animate-float-slow { animation: float-slow 15s ease-in-out infinite; }
      `}} />
    </div>
  );
};
