import { Calendar, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const STATUS_COLORS = {
  pending:   { bg: 'rgba(245,158,11,0.10)',  border: '#d97706', text: '#92400e' },
  confirmed: { bg: 'rgba(99,102,241,0.10)',  border: '#4f46e5', text: '#3730a3' },
  completed: { bg: 'rgba(16,185,129,0.10)',  border: '#059669', text: '#065f46' },
  cancelled: { bg: 'rgba(239,68,68,0.08)',   border: '#dc2626', text: '#991b1b' },
};

export default function PlanningView({ planningWeekOffset, planningRides, planningLoading, getWeekDates, onWeekChange }) {
  const weekDays = getWeekDates(planningWeekOffset);
  const today = new Date().toISOString().slice(0, 10);
  const ridesFor = (dateStr) =>
    planningRides.filter(r => r.date === dateStr)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  const weekLabel = (() => {
    const fmt = d => d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    return `${fmt(weekDays[0])} – ${fmt(weekDays[6])}`;
  })();

  return (
    <>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="icon-heading"><Calendar size={22} strokeWidth={1.5} /> Planning hebdomadaire</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.88rem', marginTop: 4 }}>{weekLabel}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-sm btn-dark" onClick={() => onWeekChange(planningWeekOffset - 1)}>
            <ChevronLeft size={15} />
          </button>
          {planningWeekOffset !== 0 && (
            <button className="btn btn-sm btn-dark" onClick={() => onWeekChange(0)} style={{ fontSize: '0.78rem' }}>
              Aujourd'hui
            </button>
          )}
          <button className="btn btn-sm btn-dark" onClick={() => onWeekChange(planningWeekOffset + 1)}>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {planningLoading ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--color-accent)', margin: '0 auto' }} />
        </div>
      ) : (
        <div className="planning-grid">
          {weekDays.map((d, i) => {
            const dateStr = d.toISOString().slice(0, 10);
            const isToday = dateStr === today;
            const rides   = ridesFor(dateStr);
            return (
              <div key={i} className={`planning-col${isToday ? ' planning-col--today' : ''}`}>
                <div className="planning-col-header">
                  <span className="planning-day-name">{DAY_NAMES[i]}</span>
                  <span className={`planning-day-num${isToday ? ' planning-day-num--today' : ''}`}>
                    {d.getDate()}
                  </span>
                  {rides.length > 0 && (
                    <span className="planning-count">{rides.length}</span>
                  )}
                </div>
                <div className="planning-col-body">
                  {rides.length === 0 ? (
                    <div className="planning-empty">—</div>
                  ) : rides.map(r => {
                    const c = STATUS_COLORS[r.status] || STATUS_COLORS.pending;
                    return (
                      <div key={r.id} className="planning-ride"
                        style={{ background: c.bg, borderLeft: `3px solid ${c.border}` }}
                        title={`${r.firstName} ${r.lastName} — ${r.departureAddress}`}
                      >
                        {r.time && <div className="planning-ride-time" style={{ color: c.text }}>{r.time}</div>}
                        <div className="planning-ride-client">{r.firstName} {r.lastName?.charAt(0)}.</div>
                        <div className="planning-ride-addr">{(r.departureAddress || '').slice(0, 28)}</div>
                        {r.estimatedPrice && (
                          <div className="planning-ride-price" style={{ color: c.text }}>
                            ~{Number(r.estimatedPrice).toFixed(0)} €
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Légende */}
      <div className="planning-legend">
        {[['pending','En attente','#f59e0b'],['confirmed','Confirmée','#6366f1'],['completed','Terminée','#10b981'],['cancelled','Annulée','#ef4444']].map(([s,l,c]) => (
          <span key={s} className="planning-legend-item">
            <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display: 'inline-block' }} />
            {l}
          </span>
        ))}
      </div>
    </>
  );
}
