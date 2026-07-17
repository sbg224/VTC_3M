import { Star } from 'lucide-react';

export default function StarsDisplay({ value, size = 14 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={size} strokeWidth={1.5}
          fill={n <= Math.round(value) ? '#267253' : 'none'}
          color={n <= Math.round(value) ? '#267253' : 'rgba(255,255,255,0.2)'} />
      ))}
    </span>
  );
}
