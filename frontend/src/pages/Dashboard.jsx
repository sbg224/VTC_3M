import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { reservationAPI, statsAPI, downloadBlob } from '../services/api';

const STATUS_LABELS = {
  pending: { label: 'En attente', badge: 'badge-pending', icon: '⏳' },
  confirmed: { label: 'Confirmée', badge: 'badge-confirmed', icon: '✅' },
  completed: { label: 'Terminée', badge: 'badge-completed', icon: '🏁' },
  cancelled: { label: 'Annulée', badge: 'badge-cancelled', icon: '❌' },
};

function StatCard({ icon, value, label, colorClass }) {
  return (
    <div className="stat-card">
      <div className={`stat-card-icon ${colorClass}`}>{icon}</div>
      <div>
        <div className="stat-card-value">{value}</div>
        <div className="stat-card-label">{label}</div>
      </div>
    </div>
  );
}

function CompleteModal({ reservation, onClose, onSuccess }) {
  const [price, setPrice] = useState(
    reservation.estimatedPrice ? String(Number(reservation.estimatedPrice).toFixed(2)) : ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!price || parseFloat(price) <= 0) {
      setError('Veuillez saisir un prix valide.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await reservationAPI.complete(reservation.id, price);
      onSuccess(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la validation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🏁 Valider la course – {reservation.reservationNumber}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <p style={{ color: 'var(--color-gray)', marginBottom: '20px', fontSize: '0.95rem' }}>
              Course : <strong>{reservation.departureAddress}</strong> → <strong>{reservation.arrivalAddress}</strong><br />
              Client : <strong>{reservation.firstName} {reservation.lastName}</strong>
            </p>
            <div className="form-group">
              <label className="form-label">Prix de la course (€) <span>*</span></label>
              <input
                type="number" className="form-control" value={price}
                onChange={e => { setPrice(e.target.value); setError(''); }}
                placeholder="Ex: 45.00" step="0.01" min="1" autoFocus
              />
              {reservation.estimatedPrice && (
                <div style={{ fontSize: '0.82rem', color: 'var(--color-gray)', marginTop: '6px' }}>
                  💡 Prix estimé à la réservation : <strong>{Number(reservation.estimatedPrice).toFixed(2)} €</strong>
                  {reservation.distance && ` (${Number(reservation.distance).toFixed(1)} km)`}
                </div>
              )}
            </div>
            <div className="alert alert-info" style={{ marginBottom: 0 }}>
              💡 Une facture PDF sera générée automatiquement et envoyée au client par email.
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline"
              style={{ color: 'var(--color-primary)', borderColor: 'var(--color-gray-light)' }}
              onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '⏳ Validation...' : '✅ Valider & Générer facture'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReservationDetail({ reservation, onClose, onUpdate, showToast }) {
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Fermeture avec la touche Echap
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const updateStatus = async (status) => {
    const label = status === 'confirmed' ? 'confirmée' : 'annulée';
    setActionError('');
    setLoading(true);
    try {
      await reservationAPI.updateStatus(reservation.id, status);
      onUpdate();
      onClose();
      showToast(`✅ Réservation ${label}.`, 'success');
    } catch (err) {
      setActionError(err.response?.data?.error || 'Erreur lors de la mise à jour.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async (type) => {
    try {
      const fn = type === 'reservation'
        ? reservationAPI.downloadReservationPdf
        : reservationAPI.downloadInvoicePdf;
      const { data } = await fn(reservation.id);
      downloadBlob(data, `${type}-${reservation.reservationNumber}.pdf`);
    } catch (err) {
      showToast('❌ Erreur lors du téléchargement du PDF.', 'error');
    }
  };

  const s = STATUS_LABELS[reservation.status];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '620px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📋 {reservation.reservationNumber}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span className={`badge ${s.badge}`}>{s.icon} {s.label}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-gray)' }}>
              {new Date(reservation.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Client', value: `${reservation.firstName} ${reservation.lastName}` },
              { label: 'Téléphone', value: reservation.phone },
              { label: 'Email', value: reservation.email },
              { label: 'Passagers / Bagages', value: `${reservation.passengers} pax – ${reservation.luggage} bag.` },
            ].map((item, i) => (
              <div key={i} style={{ background: 'var(--color-light)', padding: '10px 14px', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-gray)', textTransform: 'uppercase', marginBottom: '4px' }}>{item.label}</div>
                <div style={{ fontWeight: '600', fontSize: '0.92rem' }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--color-light)', padding: '14px', borderRadius: 'var(--radius)', marginBottom: '12px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-gray)', textTransform: 'uppercase', marginBottom: '8px' }}>Trajet</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: '600' }}>🟢 Départ</div>
                <div style={{ fontSize: '0.9rem', marginTop: '2px' }}>{reservation.departureAddress}</div>
              </div>
              <div style={{ color: 'var(--color-gray)' }}>→</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-error)', fontWeight: '600' }}>🔴 Arrivée</div>
                <div style={{ fontSize: '0.9rem', marginTop: '2px' }}>{reservation.arrivalAddress}</div>
              </div>
            </div>
            <div style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--color-gray)' }}>
              📅 {new Date(reservation.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {reservation.time}
            </div>
          </div>

          {reservation.comments && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '12px', borderRadius: 'var(--radius)', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.78rem', color: '#92400e', textTransform: 'uppercase', marginBottom: '4px' }}>💬 Commentaires</div>
              <div style={{ fontSize: '0.9rem' }}>{reservation.comments}</div>
            </div>
          )}

          {reservation.estimatedPrice && !reservation.price && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '12px', borderRadius: 'var(--radius)', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.78rem', color: '#92400e', textTransform: 'uppercase', marginBottom: '4px' }}>🧮 Prix estimé</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <span style={{ fontSize: '1.3rem', fontWeight: '700', color: '#92400e' }}>
                  {Number(reservation.estimatedPrice).toFixed(2)} €
                </span>
                {reservation.distance && (
                  <span style={{ fontSize: '0.85rem', color: '#b45309' }}>
                    {Number(reservation.distance).toFixed(1)} km
                  </span>
                )}
              </div>
            </div>
          )}

          {reservation.price && (
            <div style={{ background: '#ecfdf5', border: '1px solid #bbf7d0', padding: '12px', borderRadius: 'var(--radius)', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.78rem', color: '#065f46', textTransform: 'uppercase', marginBottom: '4px' }}>💰 Montant final</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: '700', color: '#065f46' }}>
                  {Number(reservation.price).toFixed(2)} €
                </span>
                {reservation.distance && (
                  <span style={{ fontSize: '0.85rem', color: '#065f46' }}>
                    {Number(reservation.distance).toFixed(1)} km
                  </span>
                )}
              </div>
            </div>
          )}

          {actionError && (
            <div className="alert alert-error" style={{ marginTop: '12px' }}>⚠️ {actionError}</div>
          )}

          {/* Actions statut */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
            {reservation.status === 'pending' && (
              <button className="btn btn-sm" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #bbf7d0' }}
                onClick={() => updateStatus('confirmed')} disabled={loading}>
                ✅ Confirmer
              </button>
            )}
            {reservation.status !== 'cancelled' && reservation.status !== 'completed' && (
              <button className="btn btn-sm" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}
                onClick={() => updateStatus('cancelled')} disabled={loading}>
                ❌ Annuler
              </button>
            )}
          </div>

          {/* Téléchargements PDF */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
            <button className="btn btn-sm btn-dark" onClick={() => downloadPdf('reservation')}>
              📄 Bon réservation
            </button>
            {reservation.status === 'completed' && reservation.price && (
              <button className="btn btn-sm" style={{ background: 'var(--color-accent)', color: 'var(--color-primary)' }}
                onClick={() => downloadPdf('invoice')}>
                🧾 Facture PDF
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { driver, logout } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [completeReservation, setCompleteReservation] = useState(null);
  const [toast, setToast] = useState({ msg: '', type: 'success' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
  };

  const loadStats = useCallback(async () => {
    try {
      const { data } = await statsAPI.get();
      setStats(data);
    } catch {
      showToast('❌ Impossible de charger les statistiques.', 'error');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadReservations = useCallback(async () => {
    setLoadingData(true);
    try {
      const { data } = await reservationAPI.getAll({
        status: statusFilter,
        search,
        page,
        limit: 15,
      });
      setReservations(data.reservations);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      showToast('❌ Impossible de charger les réservations.', 'error');
    } finally {
      setLoadingData(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (view === 'reservations' || view === 'dashboard') {
      loadReservations();
    }
  }, [view, loadReservations]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCompleteSuccess = (data) => {
    setCompleteReservation(null);
    showToast(
      data.invoicePdfUrl
        ? '✅ Course validée ! Facture PDF générée et envoyée au client.'
        : '✅ Course validée.',
      'success'
    );
    loadReservations();
    loadStats();
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });

  return (
    <div className="dashboard">
      {/* Toast */}
      {toast.msg && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          background: 'var(--color-primary)', color: 'var(--color-white)',
          padding: '14px 20px', borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-lg)', fontSize: '0.95rem',
          borderLeft: `4px solid ${toast.type === 'error' ? 'var(--color-error)' : 'var(--color-accent)'}`,
          maxWidth: '360px',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">🚗 VTC 3M</div>
        <nav className="sidebar-nav">
          {[
            { id: 'dashboard', icon: '📊', label: 'Tableau de bord' },
            { id: 'reservations', icon: '📋', label: 'Réservations' },
            { id: 'stats', icon: '📈', label: 'Statistiques' },
            { id: 'settings', icon: '⚙️', label: 'Paramètres' },
          ].map(item => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${view === item.id ? 'active' : ''}`}
              onClick={() => setView(item.id)}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>
            Connecté en tant que<br />
            <strong style={{ color: 'var(--color-accent)' }}>{driver?.name}</strong>
          </div>
          <button className="sidebar-nav-item" onClick={handleLogout} style={{ color: '#ef4444', width: '100%' }}>
            <span className="icon">🚪</span>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="dashboard-main">

        {/* ── VUE TABLEAU DE BORD ── */}
        {view === 'dashboard' && (
          <>
            <div className="dashboard-header">
              <h1>Bonjour, {driver?.name?.split(' ')[0]} 👋</h1>
              <p>Voici un résumé de votre activité</p>
            </div>

            {stats ? (
              <>
                <div className="stat-cards">
                  <StatCard icon="📋" value={stats.counts.total} label="Total courses" colorClass="gold" />
                  <StatCard icon="⏳" value={stats.counts.pending} label="En attente" colorClass="orange" />
                  <StatCard icon="✅" value={stats.counts.confirmed} label="Confirmées" colorClass="green" />
                  <StatCard icon="🏁" value={stats.counts.completed} label="Terminées" colorClass="blue" />
                  <StatCard icon="💰" value={`${Number(stats.revenue.month || 0).toFixed(0)} €`} label="Revenus ce mois" colorClass="gold" />
                  <StatCard icon="📅" value={stats.reservationsThisMonth} label="Réservations ce mois" colorClass="blue" />
                </div>

                {/* Graphique simple 7 jours */}
                <div className="card" style={{ marginBottom: '24px' }}>
                  <div className="card-header">
                    <h3 style={{ fontWeight: '700', fontSize: '1rem' }}>📈 Réservations – 7 derniers jours</h3>
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
                    <h3 style={{ fontWeight: '700', fontSize: '1rem' }}>🕐 Dernières réservations</h3>
                    <button className="btn btn-sm btn-dark" onClick={() => setView('reservations')}>
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
                              <td><span className={`badge ${s.badge}`}>{s.icon} {s.label}</span></td>
                              <td>
                                <button className="btn btn-sm btn-dark" onClick={() => setSelectedReservation(r)}>
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
        )}

        {/* ── VUE RÉSERVATIONS ── */}
        {view === 'reservations' && (
          <>
            <div className="dashboard-header">
              <h1>📋 Réservations</h1>
              <p>Gérez toutes vos courses ({total} au total)</p>
            </div>

            <div className="filters-bar">
              <input
                className="search-input"
                type="search"
                placeholder="🔍 Rechercher (nom, email, numéro…)"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
              <select
                className="filter-select"
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">⏳ En attente</option>
                <option value="confirmed">✅ Confirmées</option>
                <option value="completed">🏁 Terminées</option>
                <option value="cancelled">❌ Annulées</option>
              </select>
            </div>

            <div className="card">
              <div className="table-container">
                {loadingData ? (
                  <div className="loader-container"><div className="loader"></div></div>
                ) : reservations.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-gray)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
                    <p>Aucune réservation trouvée.</p>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>N° Réservation</th>
                        <th>Client</th>
                        <th>Téléphone</th>
                        <th>Date</th>
                        <th>Trajet</th>
                        <th>Statut</th>
                        <th>Prix</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservations.map(r => {
                        const s = STATUS_LABELS[r.status];
                        return (
                          <tr key={r.id}>
                            <td><strong style={{ color: 'var(--color-accent)' }}>{r.reservationNumber}</strong></td>
                            <td>
                              <div style={{ fontWeight: '600' }}>{r.firstName} {r.lastName}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--color-gray)' }}>{r.email}</div>
                            </td>
                            <td>{r.phone}</td>
                            <td>
                              <div>{formatDate(r.date)}</div>
                              <div style={{ fontSize: '0.82rem', color: 'var(--color-gray)' }}>{r.time}</div>
                            </td>
                            <td style={{ maxWidth: '200px' }}>
                              <div style={{ fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                🟢 {r.departureAddress}
                              </div>
                              <div style={{ fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                🔴 {r.arrivalAddress}
                              </div>
                            </td>
                            <td><span className={`badge ${s.badge}`}>{s.icon} {s.label}</span></td>
                            <td>{r.price ? `${Number(r.price).toFixed(2)} €` : '—'}</td>
                            <td>
                              <div className="actions">
                                <button className="btn btn-sm btn-dark" onClick={() => setSelectedReservation(r)}>
                                  Détails
                                </button>
                                {(r.status === 'pending' || r.status === 'confirmed') && (
                                  <button
                                    className="btn btn-sm"
                                    style={{ background: 'var(--color-success)', color: 'white' }}
                                    onClick={() => setCompleteReservation(r)}
                                  >
                                    🏁 Valider
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
            </div>

            {pages > 1 && (
              <div className="pagination">
                <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === pages}>›</button>
              </div>
            )}
          </>
        )}

        {/* ── VUE STATISTIQUES ── */}
        {view === 'stats' && (
          <>
            <div className="dashboard-header">
              <h1>📈 Statistiques</h1>
              <p>Vue d'ensemble de votre activité</p>
            </div>
            {stats ? (
              <div style={{ display: 'grid', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                  {[
                    { label: 'Revenus totaux', value: `${Number(stats.revenue.allTime || 0).toFixed(2)} €`, icon: '💰', color: '#c9a227' },
                    { label: 'Revenus ce mois', value: `${Number(stats.revenue.month || 0).toFixed(2)} €`, icon: '📅', color: '#10b981' },
                    { label: 'Revenus cette année', value: `${Number(stats.revenue.year || 0).toFixed(2)} €`, icon: '📆', color: '#3b82f6' },
                    { label: 'Taux de réussite', value: `${stats.counts.total > 0 ? Math.round((stats.counts.completed / stats.counts.total) * 100) : 0}%`, icon: '🎯', color: '#8b5cf6' },
                  ].map((item, i) => (
                    <div key={i} className="card" style={{ padding: '24px' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{item.icon}</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: '700', color: item.color }}>{item.value}</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--color-gray)' }}>{item.label}</div>
                    </div>
                  ))}
                </div>

                <div className="card">
                  <div className="card-header"><h3 style={{ fontWeight: '700' }}>Répartition par statut</h3></div>
                  <div className="card-body">
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {Object.entries(STATUS_LABELS).map(([key, s]) => {
                        const count = stats.counts[key] || 0;
                        const pct = stats.counts.total > 0 ? (count / stats.counts.total) * 100 : 0;
                        return (
                          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span className={`badge ${s.badge}`} style={{ minWidth: '120px', justifyContent: 'center' }}>
                              {s.icon} {s.label}
                            </span>
                            <div style={{ flex: 1, background: 'var(--color-gray-light)', borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: 'var(--color-accent)', borderRadius: '4px', transition: '0.5s' }}></div>
                            </div>
                            <span style={{ minWidth: '60px', textAlign: 'right', fontWeight: '600', fontSize: '0.9rem' }}>
                              {count} ({Math.round(pct)}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="loader-container"><div className="loader"></div></div>
            )}
          </>
        )}

        {/* ── VUE PARAMÈTRES ── */}
        {view === 'settings' && (
          <>
            <div className="dashboard-header">
              <h1>⚙️ Paramètres</h1>
              <p>Gérez votre compte</p>
            </div>
            <ChangePasswordForm showToast={showToast} />
          </>
        )}
      </main>

      {/* Modals */}
      {selectedReservation && (
        <ReservationDetail
          reservation={selectedReservation}
          onClose={() => setSelectedReservation(null)}
          onUpdate={() => { loadReservations(); loadStats(); }}
          showToast={showToast}
        />
      )}

      {completeReservation && (
        <CompleteModal
          reservation={completeReservation}
          onClose={() => setCompleteReservation(null)}
          onSuccess={handleCompleteSuccess}
        />
      )}
    </div>
  );
}

function ChangePasswordForm({ showToast }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (form.newPassword.length < 8) { setError('Le mot de passe doit faire au moins 8 caractères.'); return; }
    setLoading(true);
    try {
      await authAPI.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      showToast('✅ Mot de passe modifié avec succès.');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du changement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '480px' }}>
      <div className="card-header"><h3 style={{ fontWeight: '700' }}>🔑 Changer le mot de passe</h3></div>
      <div className="card-body">
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          {[
            { name: 'currentPassword', label: 'Mot de passe actuel' },
            { name: 'newPassword', label: 'Nouveau mot de passe' },
            { name: 'confirm', label: 'Confirmer le nouveau mot de passe' },
          ].map(field => (
            <div key={field.name} className="form-group">
              <label className="form-label">{field.label} *</label>
              <input
                type="password" name={field.name}
                className="form-control" value={form[field.name]} onChange={handleChange}
                placeholder="••••••••" autoComplete="new-password"
              />
            </div>
          ))}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? '⏳...' : '💾 Enregistrer'}
          </button>
        </form>
      </div>
    </div>
  );
}
