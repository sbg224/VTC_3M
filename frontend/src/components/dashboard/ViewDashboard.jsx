import { BarChart2, Clock, ArrowRight, Loader2 } from 'lucide-react';
import KpiCard from './KpiCard';
import StatusBadge from './StatusBadge';

const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function ViewDashboard({ driver, stats, kpis, onSelectReservation, onViewAll }) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-white font-bold text-3xl">
          Bonjour, {driver?.name?.split(' ')[0]}
        </h1>
        <p className="text-white/40 mt-1">Voici un résumé de votre activité</p>
      </div>

      {stats ? (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {kpis.map((kpi, i) => <KpiCard key={i} {...kpi} />)}
          </div>

          {/* Graphique 7 jours */}
          <div className="bg-[#111118] border border-white/8 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart2 size={16} strokeWidth={1.5} className="text-[#D4AF37]" />
              <h3 className="text-white font-semibold">Réservations — 7 derniers jours</h3>
            </div>
            <div className="flex items-end gap-2 h-28">
              {stats.last7Days?.map((day, i) => {
                const max = Math.max(...stats.last7Days.map(d => d.count), 1);
                const h = Math.max((day.count / max) * 100, 4);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[11px] font-bold text-white/60">{day.count || ''}</span>
                    <div
                      style={{ height: `${h}%` }}
                      className={`w-full rounded-t-lg transition-all duration-300 ${day.count > 0 ? 'bg-[#D4AF37]' : 'bg-white/5'}`}
                      title={`${day.count} réservation(s)`}
                    />
                    <span className="text-[10px] text-white/30 whitespace-nowrap">
                      {new Date(day.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dernières réservations */}
          <div className="bg-[#111118] border border-white/8 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Clock size={16} strokeWidth={1.5} className="text-[#D4AF37]" />
                Dernières réservations
              </h3>
              <button
                onClick={onViewAll}
                className="text-[#D4AF37] text-xs font-medium flex items-center gap-1 hover:opacity-80 transition-opacity"
              >
                Voir toutes
                <ArrowRight size={12} strokeWidth={1.5} />
              </button>
            </div>
            <div className="divide-y divide-white/5">
              {stats.latestReservations?.map(r => (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-6 py-3.5 hover:bg-white/2 transition-colors cursor-pointer"
                  onClick={() => onSelectReservation(r)}
                >
                  <div>
                    <div className="text-[#D4AF37] text-sm font-semibold">{r.reservationNumber}</div>
                    <div className="text-white/40 text-xs">{r.firstName} {r.lastName}</div>
                  </div>
                  <div className="text-white/40 text-xs hidden sm:block">{formatDate(r.date)}</div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} strokeWidth={1.5} className="text-[#D4AF37] animate-spin" />
        </div>
      )}
    </div>
  );
}
