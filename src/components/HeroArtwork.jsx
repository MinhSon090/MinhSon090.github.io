import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';

export default function HeroArtwork() {
  const ref = useRef(null);
  useEffect(() => {
    const element = ref.current;
    let inView = !('IntersectionObserver' in window);
    const updatePlayback = () => element.classList.toggle('artwork-paused', !inView || document.hidden);
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updatePlayback();
    }) : null;
    observer?.observe(element);
    document.addEventListener('visibilitychange', updatePlayback);
    updatePlayback();
    return () => {
      observer?.disconnect();
      document.removeEventListener('visibilitychange', updatePlayback);
    };
  }, []);

  return (
    <div ref={ref} className="hero-artwork artwork-paused" aria-hidden="true">
      <div className="artwork-grid" />
      <div className="artwork-ambient artwork-ambient-blue" />
      <div className="artwork-ambient artwork-ambient-lime" />
      <div className="artwork-topline"><span><span className="tiny-dot" /> IDEAS IN ORBIT</span><span>FIG. 01</span></div>
      <div className="orbital-object">
        <svg className="orbital-svg" viewBox="0 0 480 480" fill="none">
          <defs>
            <linearGradient id="orbitalBlue" x1="70" y1="40" x2="400" y2="440" gradientUnits="userSpaceOnUse"><stop stopColor="#7e96ff" /><stop offset=".42" stopColor="#3156ef" /><stop offset="1" stopColor="#152d91" /></linearGradient>
            <radialGradient id="orbitalShine" cx=".3" cy=".2" r=".9"><stop stopColor="#c7d2ff" /><stop offset=".45" stopColor="#4164f3" /><stop offset="1" stopColor="#1839b4" /></radialGradient>
            <filter id="orbitalShadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" /></filter>
          </defs>
          <ellipse cx="245" cy="406" rx="118" ry="16" fill="#193dca" opacity=".13" filter="url(#orbitalShadow)" />
          <g className="orbital-ring orbital-ring-front" transform="rotate(-28 240 240)">
            <ellipse cx="240" cy="240" rx="163" ry="111" stroke="url(#orbitalBlue)" strokeWidth="49" />
            <ellipse cx="240" cy="240" rx="164" ry="113" stroke="#a3b5ff" strokeWidth="1" opacity=".65" />
          </g>
          <g className="orbital-ring orbital-ring-back" transform="rotate(52 240 240)">
            <ellipse cx="240" cy="240" rx="161" ry="106" stroke="url(#orbitalBlue)" strokeWidth="44" />
            <ellipse cx="240" cy="240" rx="159" ry="107" stroke="#b4c1ff" strokeWidth="1" opacity=".65" />
          </g>
          <circle cx="240" cy="240" r="64" fill="url(#orbitalShine)" />
          <ellipse cx="226" cy="215" rx="25" ry="11" fill="#e0e6ff" opacity=".16" transform="rotate(-38 226 215)" />
          <g className="orbital-satellites"><circle cx="384" cy="108" r="14" fill="#d8ed75" />
          <circle cx="98" cy="357" r="7" fill="#3156ef" /></g>
        </svg>
      </div>
      <div className="artwork-caption"><span className="artwork-caption-icon"><Icon name="cube" /></span><span>A new perspective.<br /><strong>A new dimension.</strong></span><span className="artwork-plus">+</span></div>
      <div className="artwork-bottomline"><span>DESIGN · BUILD · EXPLORE</span><span>↗</span></div>
    </div>
  );
}
