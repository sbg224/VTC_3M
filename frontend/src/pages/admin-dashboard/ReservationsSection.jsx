import { RefreshCw, Search, Loader2 } from 'lucide-react';
import { fmt, fmtDate, STATUS_RES } from './adminHelpers';
import Pagination from './Pagination';

export default function ReservationsSection({
  reservations, resTotal, resPage, resFilter, resSearch, resLoading,
  onSearchChange, onFilterChange, onPage, onRefresh,
}) {
  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h1>Courses globales</h1>
        <div style={{ display:'flex', gap:8 }}>
          <span style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.82rem', alignSelf:'center' }}>{resTotal} résultats</span>
          <button className="adm-btn-icon" onClick={onRefresh}><RefreshCw size={16} strokeWidth={1.75} /></button>
        </div>
      </div>

      <div className="adm-filters">
        <div className="adm-search-wrap">
          <Search size={15} strokeWidth={1.75} />
          <input type="text" className="adm-search" placeholder="N° réservation, nom, email…"
            value={resSearch} onChange={e => onSearchChange(e.target.value)} />
        </div>
        <div className="adm-filter-tabs">
          {['all','pending','confirmed','completed','cancelled'].map(s => (
            <button key={s} className={`adm-filter-tab ${resFilter === s ? 'active' : ''}`}
              onClick={() => onFilterChange(s)}>
              {s === 'all' ? 'Toutes' : STATUS_RES[s]?.label || s}
            </button>
          ))}
        </div>
      </div>

      {resLoading ? (
        <div className="adm-loader"><Loader2 size={28} className="animate-spin" /></div>
      ) : (
        <>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th>N°</th><th>Client</th><th>Trajet</th><th>Date</th><th>Chauffeur</th><th>Statut</th><th>Prix</th></tr>
              </thead>
              <tbody>
                {reservations.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign:'center', padding:32, color:'rgba(255,255,255,0.3)' }}>Aucune réservation.</td></tr>
                ) : reservations.map(r => (
                  <tr key={r.id}>
                    <td style={{ color:'#267253', fontWeight:700, fontSize:'0.82rem', whiteSpace:'nowrap' }}>{r.reservationNumber}</td>
                    <td>
                      <div style={{ fontWeight:600, color:'#fff' }}>{r.firstName} {r.lastName}</div>
                      <div style={{ fontSize:'0.74rem', color:'rgba(255,255,255,0.38)' }}>{r.email}</div>
                    </td>
                    <td style={{ maxWidth:200 }}>
                      <div style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.7)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {r.departureAddress}
                      </div>
                      <div style={{ fontSize:'0.76rem', color:'rgba(255,255,255,0.4)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        → {r.arrivalAddress}
                      </div>
                    </td>
                    <td style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.8rem', whiteSpace:'nowrap' }}>{fmtDate(r.date)} {r.time}</td>
                    <td style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.55)' }}>{r.chauffeur?.name || '—'}</td>
                    <td><span className={`badge ${STATUS_RES[r.status]?.cls || 'badge-pending'}`}>{STATUS_RES[r.status]?.label || r.status}</span></td>
                    <td style={{ color:'#267253', fontWeight:700, whiteSpace:'nowrap' }}>
                      {r.price ? `${fmt(r.price)} €` : r.estimatedPrice ? `~${fmt(r.estimatedPrice)} €` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={resPage} total={resTotal} perPage={25} onPage={onPage} />
        </>
      )}
    </div>
  );
}
