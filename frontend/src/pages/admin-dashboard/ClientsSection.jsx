import { Search, Loader2 } from 'lucide-react';
import { fmt, fmtDateTime } from './adminHelpers';
import Pagination from './Pagination';

export default function ClientsSection({ clients, clientsTotal, clientPage, clientSearch, clientsLoading, onSearchChange, onPage }) {
  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h1>CRM Clients</h1>
        <span style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.82rem' }}>{clientsTotal} clients uniques</span>
      </div>
      <p className="adm-section-desc">Vue agrégée de tous les clients sur l'ensemble de la plateforme.</p>

      <div className="adm-filters">
        <div className="adm-search-wrap">
          <Search size={15} strokeWidth={1.75} />
          <input type="text" className="adm-search" placeholder="Rechercher par nom ou email…"
            value={clientSearch} onChange={e => onSearchChange(e.target.value)} />
        </div>
      </div>

      {clientsLoading ? (
        <div className="adm-loader"><Loader2 size={28} className="animate-spin" /></div>
      ) : (
        <>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th>Client</th><th>Téléphone</th><th>Réservations</th><th>Total dépensé</th><th>Dernière course</th></tr>
              </thead>
              <tbody>
                {clients.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign:'center', padding:32, color:'rgba(255,255,255,0.3)' }}>Aucun client trouvé.</td></tr>
                ) : clients.map((c, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ fontWeight:600, color:'#fff' }}>{c.firstName} {c.lastName}</div>
                      <div style={{ fontSize:'0.76rem', color:'rgba(255,255,255,0.38)' }}>{c.email}</div>
                    </td>
                    <td style={{ color:'rgba(255,255,255,0.55)', fontSize:'0.82rem' }}>{c.phone || '—'}</td>
                    <td style={{ color:'rgba(255,255,255,0.75)', fontWeight:600 }}>{c.reservationCount}</td>
                    <td style={{ color:'#267253', fontWeight:700 }}>{c.totalSpent ? `${fmt(c.totalSpent)} €` : '—'}</td>
                    <td style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.8rem' }}>{fmtDateTime(c.lastReservation)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={clientPage} total={clientsTotal} perPage={25} onPage={onPage} />
        </>
      )}
    </div>
  );
}
