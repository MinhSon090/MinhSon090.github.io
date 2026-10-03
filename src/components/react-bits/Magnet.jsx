// Adapted from React Bits Magnet. See docs/react-bits-LICENSE.md.
import { canAnimatePointer } from './motionPreferences.js';

export default function Magnet({ children, strength = 0.14, maxOffset = 7 }) {
  const reset = (event) => {
    event.currentTarget.style.setProperty('--magnet-x', '0px');
    event.currentTarget.style.setProperty('--magnet-y', '0px');
  };
  const handlePointerMove = (event) => {
    if (!canAnimatePointer(event)) return;
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    const clamp = (value) => Math.max(-maxOffset, Math.min(maxOffset, value));
    element.style.setProperty('--magnet-x', `${clamp((event.clientX - rect.left - rect.width / 2) * strength)}px`);
    element.style.setProperty('--magnet-y', `${clamp((event.clientY - rect.top - rect.height / 2) * strength)}px`);
  };

  return <span className="magnet" onPointerMove={handlePointerMove} onPointerLeave={reset} onPointerCancel={reset} onBlur={reset}>
    <span className="magnet-content">{children}</span>
  </span>;
}
