import { ClipboardList, Clock, CheckCircle, Flag, Euro, Calendar, TrendingUp, Star } from 'lucide-react';
import { formatDate } from '../../utils/formatDate';
import { STATUS_LABELS } from './statusLabels';
import StatCard from './StatCard';
import PerfCard from './PerfCard';

export default function HomeView({ driver, stats, onNavigate, onSelectReservation }) {
  return (
    <>
      <div className="dashboard-header">
        <h1>Bonjour, {driver?.name?.split(' ')[0]}</h1>
        <p>Voici un résumé de votre activité</p>
      </div>

      {stats ? (
        <>
          <div className="stat-cards">
            <StatCard icon={<ClipboardList size={18} strokeWidth={1.5} />} value={stats.counts.total} label="Total courses" colorClass="gold" />
            <StatCard icon={<Clock size={18} strokeWidth={1.5} />} value={stats.counts.pending} label="En attente" colorClass="orange" />
            <StatCard icon={<CheckCircle size={18} strokeWidth={1.5} />} value={stats.counts.confirmed} label="Confirmées" colorClass="green" />
            <StatCard icon={<Flag size={18} strokeWidth={1.5} />} value={stats.counts.completed} label="Terminées" colorClass="blue" />
            <StatCard icon={<Euro size={18} strokeWidth={1.5} />} value={`${Number(stats.revenue.month || 0).toFixed(0)} €`} label="Revenus ce mois" colorClass="gold" />
            <StatCard icon={<Calendar size={18} strokeWidth={1.5} />} value={stats.reservationsThisMonth} label="Réservations ce mois" colorClass="blue" />
          </div>

          {/* ── Indicateurs de performance M vs M-1 ── */}
          {stats.performance && (
            <div className="perf-cards">
              <PerfCard
                label="Courses ce mois"
                value={stats.performance.ridesThisMonth}
                prev={stats.performance.ridesPrevMonth}
                delta={stats.performance.ridesDelta}
                icon={<Flag size={16} strokeWidth={1.5} />}
              />
              <PerfCard
                label="Revenus ce mois"
                value={`${Number(stats.performance.revenueMonth).toFixed(0)} €`}
                prev={`${Number(stats.performance.revenuePrev).toFixed(0)} €`}
                delta={stats.performance.revenueDelta}
                icon={<Euro size={16} strokeWidth={1.5} />}
              />
              {stats.reviews?.count > 0 && (
                <PerfCard
                  label="Note clients"
                  value={`${stats.reviews.average} / 5`}
                  prev={`${stats.reviews.count} avis`}
                  delta={null}
                  icon={<Star size={16} strokeWidth={1.5} />}
                  starValue={stats.reviews.average}
                />
              )}
            </div>
          )}

          {/* Graphique simple 7 jours */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <h3 style={{ fontWeight: '700', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}><TrendingUp size={15} strokeWidth={1.5} /> Réservations – 7 derniers jours</h3>
            </div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px' }}>
                {stats.last7Days?.map((day, i) => {
                  const max = Math.max(...stats.last7Days.map(d => d.count), 1);
                  const h = Math.max((day.count / max) * 100, 4);
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-primary)' }}>{day.count || ''}</span>
                      <div style={{
                        width: '100%', height: `${h}%`,
                        background: day.count > 0 ? 'var(--color-accent)' : 'var(--color-gray-light)',
                        borderRadius: '4px 4px 0 0', transition: '0.3s',
                        minHeight: '4px',
                      }} title={`${day.count} réservation(s)`}></div>
                      <span style={{ fontSize: '0.68rem', color: 'var(--color-gray)', whiteSpace: 'nowrap' }}>
                        {new Date(day.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dernières réservations */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: '700', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={15} strokeWidth={1.5} /> Dernières réservations</h3>
              <button className="btn btn-sm btn-dark" onClick={() => onNavigate('reservations')}>
                Voir toutes
              </button>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.latestReservations?.map(r => {
                    const s = STATUS_LABELS[r.status];
                    return (
                      <tr key={r.id}>
                        <td><strong>{r.reservationNumber}</strong></td>
                        <td>{r.firstName} {r.lastName}</td>
                        <td>{formatDate(r.date)}</td>
                        <td><span className={`badge ${s.badge}`}><s.Icon size={12} strokeWidth={1.5} /> {s.label}</span></td>
                        <td>
                          <button className="btn btn-sm btn-dark" onClick={() => onSelectReservation(r)}>
                            Détails
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="loader-container"><div className="loader"></div></div>
      )}
    </>
  );
}
