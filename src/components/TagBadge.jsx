import React from 'react';
import { useIntersection } from '@/hooks/useIntersection';

export default function TagBadge({ label, color }) {
  // threshold 를 0 으로 설정해서, 살짝이라도 화면에 들어오면 inView=true
  const [ref, inView] = useIntersection({ threshold: 0 });

  return (
    <span
      ref={ref}
      className={`tag-badge ${inView ? 'animate-slideUpFade' : ''}`}
      style={{ '--badge-color': color }}
    >
      {label}
    </span>
  );
}
