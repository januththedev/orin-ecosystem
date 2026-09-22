import { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Lenis from 'lenis';
import App from './App';
import './index.css';

function boot(): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Lenis: weighted, fluid — off entirely under reduced motion.
  if (!reduced) {
    const lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 1 });
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener('beforeunload', () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    });
  }
  const root = document.getElementById('root');
  if (root) createRoot(root).render(<App />);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
