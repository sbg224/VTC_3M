import { BarChart2, Euro, CalendarDays, TrendingUp, CheckCircle, Loader2 } from 'lucide-react';
import KpiCard from './KpiCard';
import StatusBadge, { STATUS_CONFIG } from './StatusBadge';

export default function ViewStats({ stats, completionRate }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-white font-bold text-3xl flex items-center gap-3">
          <BarChart2 size={28} strokeWidth={1.5} className="text-[#D4AF37]" />
          Statistiques
        </h1>
        <p className="text-white/40 mt-1">Vue d'ensemble de votre activité</p>
      </div>

      {stats ? (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: 'Revenus totaux',      value: `${Number(stats.revenue.allTime || 0).toFixed(2)} €`, Icon: Euro },
              { label: 'Revenus ce mois',     value: `${Number(stats.revenue.month || 0).toFixed(2)} €`,   Icon: CalendarDays },
              { label: 'Revenus cette année', value: `${Number(stats.revenue.year || 0).toFixed(2)} €`,    Icon: TrendingUp },
              { label: 'Taux de réussite',    value: `${completionRate}%`,                                 Icon: CheckCircle },
            ].map((item, i) => <KpiCard key={i} {...item} />)}
          </div>

          <div className="bg-[#111118] border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/8">
              <h3 className="text-white font-semibold">Répartition par statut</h3>
            </div>
            <div className="p-6 flex flex-col gap-4">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const count = stats.counts[key] || 0;
                const pct = stats.counts.total > 0 ? (count / stats.counts.total) * 100 : 0;
                return (
                  <div key={key} className="flex items-center gap-4">
                    <StatusBadge status={key} />
                    <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full bg-[#D4AF37] rounded-full transition-all duration-500"
                      />
                    </div>
                    <span className="text-white/50 text-sm font-medium min-w-[60px] text-right">
                      {count} ({Math.round(pct)}%)
                    </span>
                  </div>
                );
              })}
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
