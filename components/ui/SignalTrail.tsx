
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
      let clientX: number;
      let clientY: number;

      // Safely distinguish between TouchEvent and MouseEvent
      if ('touches' in e) {
        // It's a TouchEvent
        if (e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else {
          return; // No touch points available
        }
      } else {
        // It's a MouseEvent
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      // Throttle creation distance
      const dist = Math.hypot(clientX - lastPos.current.x, clientY - lastPos.current.y);
      if (dist > 15) { 
        createParticle(clientX, clientY);
        lastPos.current = { x: clientX, y: clientY };
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
