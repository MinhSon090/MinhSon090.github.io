export function canAnimatePointer(event) {
  return event.pointerType === 'mouse'
    && window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches;
}
