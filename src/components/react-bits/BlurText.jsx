// Adapted from React Bits Blur Text. See docs/react-bits-LICENSE.md.
import { Fragment, useEffect, useRef } from 'react';

export default function BlurText({ text, className = '', delay = 90, startDelay = 0 }) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionPreference.matches || !('IntersectionObserver' in window)) return;

    element.classList.add('blur-text-pending');
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.classList.add('blur-text-visible');
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    const showImmediately = () => {
      if (motionPreference.matches) {
        element.classList.remove('blur-text-pending', 'blur-text-visible');
        observer.disconnect();
      }
    };
    observer.observe(element);
    motionPreference.addEventListener('change', showImmediately);

    return () => {
      observer.disconnect();
      motionPreference.removeEventListener('change', showImmediately);
      element.classList.remove('blur-text-pending', 'blur-text-visible');
    };
  }, [text]);

  const words = text.split(' ');
  return <span ref={ref} className={`blur-text ${className}`}>
    <span className="sr-only">{text}</span>
    <span aria-hidden="true">{words.map((word, index) => <Fragment key={`${word}-${index}`}>
      <span className="blur-text-word" style={{ '--word-delay': `${startDelay + index * delay}ms` }}>{word}</span>
      {index < words.length - 1 && ' '}
    </Fragment>)}</span>
  </span>;
}
