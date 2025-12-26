
import React, { useEffect, useRef } from 'react';

interface SignalTrailProps {
  activeTrail: string | undefined;
}

export const SignalTrail: React.FC<SignalTrailProps> = ({ activeTrail }) => {
  const requestRef = useRef<number | null>(null);
  const lastPos = useRef({ x: 0, y: 0 });
  const trailContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeTrail || !trailContainer.current) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const x = (e as MouseEvent).clientX || (e as TouchEvent).touches[0].clientX;
      const y = (e as MouseEvent).clientY || (e as TouchEvent).touches[0].clientY;

      // Throttle creation distance
      const dist = Math.hypot(x - lastPos.current.x, y - lastPos.current.y);
      if (dist > 15) { 
        createParticle(x, y);
        lastPos.current = { x, y };
      }
    };

    const createParticle = (x: number, y: number) => {
      if (!trailContainer.current) return;
      const dot = document.createElement('div');
      dot.className = `signal-trail-dot trail-${activeTrail}`;
      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;
      // Randomize size slightly
      const size = Math.random() * 6 + 4;
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      
      trailContainer.current.appendChild(dot);

      // Cleanup happens via CSS animation 'trail-fade' on globals.css,
      // but we remove from DOM after animation completes
      setTimeout(() => {
        if (dot.parentNode) dot.parentNode.removeChild(dot);
      }, 800);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
    };
  }, [activeTrail]);

  if (!activeTrail) return null;

  return <div ref={trailContainer} className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden" />;
};
