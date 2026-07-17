import { useState, useEffect, useCallback } from 'react';
import {
  Users2, CheckCircle, Euro, Search, RefreshCw, Download,
  Mail, Phone, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { crmAPI, downloadBlob } from '../../services/api';
import { formatDate } from '../../utils/formatDate';
import StatCard from './StatCard';

export default function CrmView({ showToast }) {
  const [clients,  setClients]  = useState([]);
  const [total,    setTotal]    = useState(0);
  const [pages,    setPages]    = useState(1);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await crmAPI.getClients({ page, limit: 20, search });
      setClients(data.clients);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      showToast('Impossible de charger les clients.', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { loadClients(); }, [loadClients]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await crmAPI.exportCsv({ search });
      downloadBlob(data, `crm-clients-${new Date().toISOString().slice(0, 10)}.csv`);
      showToast('Export CSV téléchargé.', 'success');
    } catch {
      showToast('Erreur lors de l\'export CSV.', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      {/* Stats rapides */}
      <div className="stat-cards" style={{ marginBottom: '24px' }}>
        <StatCard icon={<Users2 size={18} strokeWidth={1.5} />}    value={total}     label="Clients uniques"  colorClass="gold" />
        <StatCard icon={<CheckCircle size={18} strokeWidth={1.5} />} value={clients.reduce((s, c) => s + c.completedReservations, 0)} label="Courses terminées" colorClass="green" />
        <StatCard icon={<Euro size={18} strokeWidth={1.5} />}       value={`${clients.reduce((s, c) => s + c.totalSpent, 0).toFixed(0)} €`} label="Total encaissé (page)" colorClass="gold" />
      </div>

      {/* Barre de filtres + export */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '14px 20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1', minWidth: '220px', position: 'relative' }}>
            <Search size={14} strokeWidth={1.5} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray)' }} />
            <input
              type="text" className="form-control"
              placeholder="Rechercher par nom ou email…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ paddingLeft: '36px', fontSize: '0.875rem' }}
            />
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-gray)' }}>
            {total} client{total > 1 ? 's' : ''}
          </div>
          <button
            className="btn btn-sm btn-dark"
            onClick={handleExport}
            disabled={exporting || total === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}
          >
            {exporting
              ? <><RefreshCw size={13} strokeWidth={1.5} className="animate-spin" /> Export…</>
              : <><Download size={13} strokeWidth={1.5} /> Export CSV</>}
          </button>
        </div>
      </div>

      {/* Table clients */}
      <div className="card">
        <div className="table-container">
          {loading ? (
            <div className="loader-container"><div className="loader"></div></div>
          ) : clients.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-gray)' }}>
              <Users2 size={32} strokeWidth={1} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>Aucun client trouvé</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Contact</th>
                  <th>Courses</th>
                  <th>Terminées</th>
                  <th>Total dépensé</th>
                  <th>1ère réservation</th>
                  <th>Dernière réservation</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c, i) => (
                  <tr key={`${c.email}-${i}`}>
                    <td>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                        {c.fullName || <span style={{ color: 'var(--color-gray)', fontStyle: 'italic' }}>—</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: 'var(--color-gray)' }}>
                          <Mail size={11} strokeWidth={1.5} /> {c.email}
                        </span>
                        {c.phone && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: 'var(--color-gray)' }}>
                            <Phone size={11} strokeWidth={1.5} /> {c.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--color-white)' }}>
                        {c.totalReservations}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: '999px',
                        background: c.completedReservations > 0 ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)',
                        color: c.completedReservations > 0 ? '#22c55e' : 'var(--color-gray)',
                        fontSize: '0.82rem', fontWeight: '700',
                        border: `1px solid ${c.completedReservations > 0 ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
                      }}>
                        {c.completedReservations}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: '700', color: c.totalSpent > 0 ? 'var(--color-accent)' : 'var(--color-gray)', fontSize: '0.9rem' }}>
                        {c.totalSpent > 0 ? `${c.totalSpent.toFixed(2)} €` : '—'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--color-gray)' }}>
                      {formatDate(c.firstReservationDate)}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--color-gray)' }}>
                      {formatDate(c.lastReservationDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', padding: '16px', borderTop: '1px solid var(--color-border)' }}>
            <button className="btn btn-sm btn-dark" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft size={14} strokeWidth={1.5} />
            </button>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-gray)' }}>Page {page} / {pages}</span>
            <button className="btn btn-sm btn-dark" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>
              <ChevronRight size={14} strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
