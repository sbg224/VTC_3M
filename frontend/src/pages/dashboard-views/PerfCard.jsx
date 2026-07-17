import { ArrowUp, ArrowDown, Minus, Star } from 'lucide-react';

export default function PerfCard({ label, value, prev, delta, icon, starValue }) {
  const DeltaIcon = delta === null ? null : delta > 0 ? ArrowUp : delta < 0 ? ArrowDown : Minus;
  const deltaColor = delta === null ? '#267253' : delta > 0 ? '#10b981' : delta < 0 ? '#ef4444' : 'rgba(255,255,255,0.4)';
  return (
    <div className="perf-card">
      <div className="perf-card-icon">{icon}</div>
      <div style={{ flex: 1 }}>
        <div className="perf-card-label">{label}</div>
        <div className="perf-card-value">{value}</div>
        {starValue !== undefined && (
          <div style={{ display: 'flex', gap: 2, marginTop: 3 }}>
            {[1,2,3,4,5].map(n => (
              <Star key={n} size={11} strokeWidth={1.5}
                fill={n <= Math.round(starValue) ? '#267253' : 'none'}
                color={n <= Math.round(starValue) ? '#267253' : 'rgba(255,255,255,0.2)'} />
            ))}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        {delta !== null && DeltaIcon && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: deltaColor, fontSize: '0.8rem', fontWeight: 700 }}>
            <DeltaIcon size={13} strokeWidth={2.5} />
            {Math.abs(delta)}%
          </div>
        )}
        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
          {delta !== null ? `mois préc. : ${prev}` : prev}
        </div>
      </div>
    </div>
  );
}
