import { STATUS_DRIVER } from './adminHelpers';

export default function DriverBadge({ status }) {
  const s = STATUS_DRIVER[status] || STATUS_DRIVER.expired;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:9999, fontSize:'0.72rem', fontWeight:700, color: s.color, background: s.bg, border:`1px solid ${s.color}40` }}>
      <s.Icon size={11} strokeWidth={2} /> {s.label}
    </span>
  );
}
