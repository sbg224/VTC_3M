import { Search, ClipboardList, Loader2, MapPin, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import StatusBadge, { STATUS_CONFIG } from './StatusBadge';

const FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function ReservationTable({
  reservations, total, pages, page, setPage,
  statusFilter, setStatusFilter,
  search, setSearch,
  loading,
  onSelect, onComplete,
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-white font-bold text-3xl flex items-center gap-3">
          <ClipboardList size={28} strokeWidth={1.5} className="text-[#D4AF37]" />
          Réservations
        </h1>
        <p className="text-white/40 mt-1">{total} course{total > 1 ? 's' : ''} au total</p>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            className="input-dark pl-10"
            type="search"
            placeholder="Rechercher (nom, email, numéro...)"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                statusFilter === s
                  ? 'bg-[#D4AF37]/15 text-[#D4AF37] border-[#D4AF37]/30'
                  : 'bg-white/3 border-white/10 text-white/40 hover:text-white/70 hover:bg-white/8'
              }`}
            >
              {s === 'all' ? 'Tous' : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-[#111118] border border-white/8 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} strokeWidth={1.5} className="text-[#D4AF37] animate-spin" />
          </div>
        ) : reservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/30">
            <ClipboardList size={40} strokeWidth={1} className="mb-3 text-white/50" />
            <p className="text-sm">Aucune réservation trouvée.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/8">
                  {['N° Réservation', 'Client', 'Date', 'Trajet', 'Statut', 'Prix', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reservations.map(r => (
                  <tr key={r.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-[#D4AF37] font-semibold text-sm">{r.reservationNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white text-sm font-medium">{r.firstName} {r.lastName}</div>
                      <div className="text-white/30 text-xs">{r.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white/70 text-sm">{formatDate(r.date)}</div>
                      <div className="text-white/30 text-xs">{r.time}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[180px]">
                      <div className="flex items-center gap-1 text-white/60 text-xs mb-0.5">
                        <MapPin size={10} strokeWidth={1.5} className="text-green-400 shrink-0" />
                        <span className="truncate">{r.departureAddress}</span>
                      </div>
                      <div className="flex items-center gap-1 text-white/60 text-xs">
                        <MapPin size={10} strokeWidth={1.5} className="text-red-400 shrink-0" />
                        <span className="truncate">{r.arrivalAddress}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-white/70 text-sm">
                      {r.price ? `${Number(r.price).toFixed(2)} €` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          className="bg-white/5 border border-white/10 text-white/60 px-3 py-1.5 rounded-lg text-xs hover:bg-white/10 transition-colors"
                          onClick={() => onSelect(r)}
                        >
                          Détails
                        </button>
                        {(r.status === 'pending' || r.status === 'confirmed') && (
                          <button
                            className="bg-green-500/15 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-lg text-xs hover:bg-green-500/25 transition-colors flex items-center gap-1"
                            onClick={() => onComplete(r)}
                          >
                            <CheckCircle size={11} strokeWidth={1.5} />
                            Valider
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors disabled:opacity-30"
            onClick={() => setPage(p => p - 1)} disabled={page === 1}
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                p === page
                  ? 'bg-[#D4AF37] text-black'
                  : 'border border-white/10 text-white/40 hover:bg-white/5 hover:text-white/70'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors disabled:opacity-30"
            onClick={() => setPage(p => p + 1)} disabled={page === pages}
          >
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}
