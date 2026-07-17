export default function KpiCard({ icon, value, label, sub, color = '#267253', onClick }) {
  return (
    <div className="adm-kpi" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="adm-kpi-icon" style={{ background: `${color}1a`, color }}>{icon}</div>
      <div>
        <div className="adm-kpi-value">{value}</div>
        <div className="adm-kpi-label">{label}</div>
        {sub && <div className="adm-kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}
