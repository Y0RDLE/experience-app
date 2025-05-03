// src/hooks/useIntersection.js
import { useEffect, useRef, useState } from 'react';
export function useIntersection({ root = null, rootMargin, threshold = 0.1 }) {
  const ref = useRef();
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { root, rootMargin, threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [root, rootMargin, threshold]);
  return [ref, inView];
}
