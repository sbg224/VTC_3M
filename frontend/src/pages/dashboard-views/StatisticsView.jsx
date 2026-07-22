import { Calendar, Euro, Flag, TrendingUp } from 'lucide-react';
import { STATUS_LABELS } from './statusLabels';

export default function StatisticsView({ stats }) {
  if (!stats) return <div className="loader-container"><div className="loader" /></div>;

  const indicators = [
    { label: 'Revenus totaux', value: `${Number(stats.revenue.allTime || 0).toFixed(2)} €`, Icon: Euro, color: '#267253' },
    { label: 'Revenus ce mois', value: `${Number(stats.revenue.month || 0).toFixed(2)} €`, Icon: Calendar, color: '#10b981' },
    { label: 'Revenus cette année', value: `${Number(stats.revenue.year || 0).toFixed(2)} €`, Icon: TrendingUp, color: '#3b82f6' },
    { label: 'Taux de réussite', value: `${stats.counts.total > 0 ? Math.round((stats.counts.completed / stats.counts.total) * 100) : 0}%`, Icon: Flag, color: '#8b5cf6' },
  ];

  return <><div className="dashboard-header"><h1 className="icon-heading"><TrendingUp size={22} strokeWidth={1.5} /> Statistiques</h1><p>Vue d'ensemble de votre activité</p></div><div style={{ display: 'grid', gap: '24px' }}><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>{indicators.map(({ label, value, Icon, color }) => <div key={label} className="card" style={{ padding: '24px' }}><Icon size={28} strokeWidth={1.5} style={{ color, marginBottom: '8px' }} /><div style={{ fontSize: '1.8rem', fontWeight: '700', color }}>{value}</div><div style={{ fontSize: '0.9rem', color: 'var(--color-gray)' }}>{label}</div></div>)}</div><div className="card"><div className="card-header"><h3 style={{ fontWeight: '700' }}>Répartition par statut</h3></div><div className="card-body"><div style={{ display: 'grid', gap: '12px' }}>{Object.entries(STATUS_LABELS).map(([key, status]) => { const count = stats.counts[key] || 0; const percent = stats.counts.total > 0 ? (count / stats.counts.total) * 100 : 0; return <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}><span className={`badge ${status.badge}`} style={{ minWidth: '120px', justifyContent: 'center' }}><status.Icon size={12} strokeWidth={1.5} /> {status.label}</span><div style={{ flex: 1, background: 'var(--color-gray-light)', borderRadius: '4px', height: '10px', overflow: 'hidden' }}><div style={{ width: `${percent}%`, height: '100%', background: 'var(--color-accent)', borderRadius: '4px', transition: '0.5s' }} /></div><span style={{ minWidth: '60px', textAlign: 'right', fontWeight: '600', fontSize: '0.9rem' }}>{count} ({Math.round(percent)}%)</span></div>; })}</div></div></div></div></>;
}
