import { useState, useEffect, useCallback } from 'react';
import {
  Users, UserCheck, Clock, ClipboardList, Euro, BarChart3,
  Search, ChevronLeft, ChevronRight, Copy, Ban,
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import StatCard from './StatCard';

const STATUS_DRIVER_META = {
  pending:   { label: 'En attente', color: '#a78bfa' },
  trial:     { label: 'Essai',      color: '#267253' },
  active:    { label: 'Actif',      color: '#22c55e' },
  suspended: { label: 'Suspendu',   color: '#f97316' },
  expired:   { label: 'Expiré',     color: '#ef4444' },
};

export default function AdminView({ showToast }) {
  const [globalStats,   setGlobalStats]   = useState(null);
  const [drivers,       setDrivers]       = useState([]);
  const [total,         setTotal]         = useState(0);
  const [pages,         setPages]         = useState(1);
  const [page,          setPage]          = useState(1);
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('all');
  const [loadingStats,  setLoadingStats]  = useState(true);
  const [loadingList,   setLoadingList]   = useState(false);
  const [actionId,      setActionId]      = useState(null);

  // Chargement stats globales
  useEffect(() => {
    adminAPI.getGlobalStats()
      .then(({ data }) => setGlobalStats(data))
      .catch(() => showToast('Impossible de charger les statistiques globales.', 'error'))
      .finally(() => setLoadingStats(false));
  }, []);

  // Chargement liste chauffeurs
  const loadDrivers = useCallback(async () => {
    setLoadingList(true);
    try {
      const { data } = await adminAPI.getDrivers({ page, limit: 15, search, status: statusFilter });
      setDrivers(data.drivers);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      showToast('Impossible de charger la liste des chauffeurs.', 'error');
    } finally {
      setLoadingList(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { loadDrivers(); }, [loadDrivers]);

  const handleStatusChange = async (driverId, newStatus) => {
    setActionId(driverId);
    try {
      await adminAPI.updateStatus(driverId, newStatus);
      showToast('Statut mis à jour.', 'success');
      loadDrivers();
      // Rafraîchir aussi les stats globales
      adminAPI.getGlobalStats().then(({ data }) => setGlobalStats(data)).catch(() => {});
    } catch {
      showToast('Erreur lors de la mise à jour du statut.', 'error');
    } finally {
      setActionId(null);
    }
  };

  const copyBookingLink = (slug) => {
    const url = `${window.location.origin}/book/${slug}`;
    navigator.clipboard.writeText(url).then(() => showToast('Lien copié !', 'success'));
  };

  const trialDaysLeft = (trialEndDate) => {
    if (!trialEndDate) return null;
    const diff = Math.ceil((new Date(trialEndDate) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div>
      {/* ── Stats globales ── */}
      {loadingStats ? (
        <div className="loader-container"><div className="loader"></div></div>
      ) : globalStats && (
        <div className="stat-cards" style={{ marginBottom: '32px' }}>
          <StatCard icon={<Users size={18} strokeWidth={1.5} />}     value={globalStats.drivers.total}            label="Chauffeurs inscrits"   colorClass="gold" />
          <StatCard icon={<UserCheck size={18} strokeWidth={1.5} />} value={globalStats.drivers.byStatus.active}  label="Abonnements actifs"    colorClass="green" />
          <StatCard icon={<Clock size={18} strokeWidth={1.5} />}     value={globalStats.drivers.byStatus.trial}   label="En essai gratuit"      colorClass="orange" />
          <StatCard icon={<ClipboardList size={18} strokeWidth={1.5} />} value={globalStats.reservations.total}  label="Réservations totales"  colorClass="blue" />
          <StatCard icon={<Euro size={18} strokeWidth={1.5} />}      value={`${Number(globalStats.revenue.total).toFixed(0)} €`}  label="Revenu total plateforme" colorClass="gold" />
          <StatCard icon={<BarChart3 size={18} strokeWidth={1.5} />} value={`${Number(globalStats.revenue.month).toFixed(0)} €`}  label="Revenus ce mois"        colorClass="blue" />
        </div>
      )}

      {/* ── Filtres ── */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body" style={{ padding: '16px 20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1', minWidth: '200px', position: 'relative' }}>
            <Search size={14} strokeWidth={1.5} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray)' }} />
            <input
              type="text" className="form-control" placeholder="Rechercher un chauffeur..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ paddingLeft: '36px', fontSize: '0.875rem' }}
            />
          </div>
          <select
            className="form-control" value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ maxWidth: '160px', fontSize: '0.875rem' }}
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="trial">Essai</option>
            <option value="active">Actif</option>
            <option value="suspended">Suspendu</option>
            <option value="expired">Expiré</option>
          </select>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-gray)', marginLeft: 'auto' }}>
            {total} chauffeur{total > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* ── Table chauffeurs ── */}
      <div className="card">
        <div className="table-container">
          {loadingList ? (
            <div className="loader-container"><div className="loader"></div></div>
          ) : drivers.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-gray)' }}>
              <Users size={32} strokeWidth={1} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>Aucun chauffeur trouvé</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Chauffeur</th>
                  <th>Statut</th>
                  <th>Plan</th>
                  <th>Courses</th>
                  <th>Revenus</th>
                  <th>Lien réservation</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(d => {
                  const meta = STATUS_DRIVER_META[d.status] || STATUS_DRIVER_META.expired;
                  const days = d.status === 'trial' ? trialDaysLeft(d.trialEndDate) : null;
                  const isActioning = actionId === d.id;
                  return (
                    <tr key={d.id}>
                      <td>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{d.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-gray)' }}>{d.email}</div>
                        {d.businessName && <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}>{d.businessName}</div>}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: '999px',
                          background: `${meta.color}18`, color: meta.color,
                          fontSize: '0.78rem', fontWeight: '700', border: `1px solid ${meta.color}40`,
                          whiteSpace: 'nowrap',
                        }}>
                          {meta.label}
                          {days !== null && ` (${days}j)`}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: d.plan === 'pro' ? 'var(--color-accent)' : 'var(--color-gray)' }}>
                        {d.plan === 'pro' ? 'Pro' : 'Gratuit'}
                      </td>
                      <td style={{ fontSize: '0.85rem', fontWeight: '600' }}>{d.reservationCount}</td>
                      <td style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-accent)' }}>
                        {Number(d.totalRevenue).toFixed(0)} €
                      </td>
                      <td>
                        {d.slug ? (
                          <button
                            className="btn btn-sm btn-dark"
                            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                            onClick={() => copyBookingLink(d.slug)}
                            title={`/book/${d.slug}`}
                          >
                            <Copy size={12} strokeWidth={1.5} /> Copier
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-gray)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {d.status === 'pending' && (<>
                            <button
                              className="btn btn-sm"
                              style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => handleStatusChange(d.id, 'trial')}
                              disabled={isActioning}
                            >
                              <UserCheck size={12} strokeWidth={1.5} /> Valider
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => handleStatusChange(d.id, 'suspended')}
                              disabled={isActioning}
                            >
                              <Ban size={12} strokeWidth={1.5} /> Rejeter
                            </button>
                          </>)}
                          {d.status !== 'pending' && d.status !== 'active' && (
                            <button
                              className="btn btn-sm"
                              style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => handleStatusChange(d.id, 'active')}
                              disabled={isActioning}
                            >
                              <UserCheck size={12} strokeWidth={1.5} /> Activer
                            </button>
                          )}
                          {d.status !== 'pending' && d.status !== 'suspended' && (
                            <button
                              className="btn btn-sm"
                              style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => handleStatusChange(d.id, 'suspended')}
                              disabled={isActioning}
                            >
                              <Ban size={12} strokeWidth={1.5} /> Suspendre
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
