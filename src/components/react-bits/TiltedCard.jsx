// Inspired by React Bits Tilted Card. See docs/react-bits-LICENSE.md.
import { canAnimatePointer } from './motionPreferences.js';

export default function TiltedCard({ children, amplitude = 6 }) {
  const handlePointerMove = (event) => {
    if (!canAnimatePointer(event)) return;
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
    const y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
    element.style.setProperty('--tilt-x', `${-y * amplitude}deg`);
    element.style.setProperty('--tilt-y', `${x * amplitude}deg`);
    element.style.setProperty('--glare-x', `${(x + 1) * 50}%`);
    element.style.setProperty('--glare-y', `${(y + 1) * 50}%`);
  };
  const reset = (event) => {
    event.currentTarget.style.setProperty('--tilt-x', '0deg');
    event.currentTarget.style.setProperty('--tilt-y', '0deg');
  };

  return <div className="tilted-card" onPointerMove={handlePointerMove} onPointerLeave={reset} onPointerCancel={reset}>
    <div className="tilted-card-surface">{children}</div>
  </div>;
}
