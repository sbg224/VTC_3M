import { RefreshCw, Search, Loader2, Eye } from 'lucide-react';
import { fmt, fmtDate, STATUS_DRIVER } from './adminHelpers';
import DriverBadge from './DriverBadge';
import Pagination from './Pagination';

export default function DriversSection({
  drivers, driversTotal, driverPage, driverFilter, driverSearch, driversLoading, pendingCount,
  onSearchChange, onFilterChange, onPage, onRefresh, onSelectDriver,
}) {
  return (
    <div className="adm-section">
      <div className="adm-section-header">
        <h1>CRM Chauffeurs</h1>
        <button className="adm-btn-icon" onClick={onRefresh}><RefreshCw size={16} strokeWidth={1.75} /></button>
      </div>

      {/* Filtres */}
      <div className="adm-filters">
        <div className="adm-search-wrap">
          <Search size={15} strokeWidth={1.75} />
          <input
            type="text" className="adm-search" placeholder="Rechercher par nom ou email…"
            value={driverSearch}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
        <div className="adm-filter-tabs">
          {['all','pending','trial','active','suspended','expired'].map(s => (
            <button
              key={s}
              className={`adm-filter-tab ${driverFilter === s ? 'active' : ''}`}
              onClick={() => onFilterChange(s)}
            >
              {s === 'all' ? 'Tous' : STATUS_DRIVER[s]?.label || s}
              {s === 'pending' && pendingCount > 0 && <span className="adm-badge">{pendingCount}</span>}
            </button>
          ))}
        </div>
      </div>

      {driversLoading ? (
        <div className="adm-loader"><Loader2 size={28} className="animate-spin" /></div>
      ) : (
        <>
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Chauffeur</th><th>Statut</th><th>Plan</th>
                  <th>Courses</th><th>Revenus</th><th>Inscrit</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign:'center', padding:32, color:'rgba(255,255,255,0.3)' }}>Aucun chauffeur trouvé.</td></tr>
                ) : drivers.map(d => (
                  <tr key={d.id}>
                    <td>
                      <div style={{ fontWeight:600, color:'#fff' }}>{d.name}</div>
                      <div style={{ fontSize:'0.76rem', color:'rgba(255,255,255,0.4)' }}>{d.email}</div>
                    </td>
                    <td><DriverBadge status={d.status} /></td>
                    <td><span style={{ color:'#267253', fontWeight:700, textTransform:'uppercase', fontSize:'0.78rem' }}>{d.plan}</span></td>
                    <td style={{ color:'rgba(255,255,255,0.75)' }}>{d.reservationCount}</td>
                    <td style={{ color:'#267253', fontWeight:700 }}>{fmt(d.totalRevenue)} €</td>
                    <td style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.8rem' }}>{fmtDate(d.createdAt)}</td>
                    <td>
                      <button className="adm-btn-icon-sm" onClick={() => onSelectDriver(d.id)} title="Voir la fiche">
                        <Eye size={14} strokeWidth={1.75} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={driverPage} total={driversTotal} perPage={20} onPage={onPage} />
        </>
      )}
    </div>
  );
}
