import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Car, LayoutDashboard, ClipboardList, TrendingUp, Calculator,
  Settings, LogOut, Clock, CheckCircle, Flag, XCircle, Euro,
  Inbox, Search, MessageSquare, FileText, Receipt, AlertTriangle,
  MapPin, Calendar, ChevronLeft, ChevronRight,
  CreditCard, Zap, Shield, RefreshCw, ExternalLink,
  Users, BarChart3, Ban, UserCheck, Copy, Link,
  Users2, Download, Phone, Mail,
} from 'lucide-react';
import { useAuth } from '../services/auth';
import { reservationAPI, statsAPI, billingAPI, adminAPI, crmAPI, authAPI, downloadBlob } from '../services/api';

const STATUS_LABELS = {
  pending:   { label: 'En attente', badge: 'badge-pending',   Icon: Clock },
  confirmed: { label: 'Confirmée',  badge: 'badge-confirmed', Icon: CheckCircle },
  completed: { label: 'Terminée',   badge: 'badge-completed', Icon: Flag },
  cancelled: { label: 'Annulée',    badge: 'badge-cancelled', Icon: XCircle },
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
          <h3 className="flex items-center gap-2"><Flag size={16} strokeWidth={1.5} /> Valider la course – {reservation.reservationNumber}</h3>
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
                  Prix estimé à la réservation : <strong>{Number(reservation.estimatedPrice).toFixed(2)} €</strong>
                  {reservation.distance && ` (${Number(reservation.distance).toFixed(1)} km)`}
                </div>
              )}
            </div>
            <div className="alert alert-info" style={{ marginBottom: 0 }}>
              Une facture PDF sera générée automatiquement et envoyée au client par email.
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline"
              style={{ color: 'var(--color-primary)', borderColor: 'var(--color-gray-light)' }}
              onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><Clock size={14} className="animate-spin" /> Validation...</> : <><CheckCircle size={14} strokeWidth={1.5} /> Valider &amp; Générer facture</>}
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
      showToast(`Réservation ${label}.`, 'success');
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
      showToast('Erreur lors du téléchargement du PDF.', 'error');
    }
  };

  const s = STATUS_LABELS[reservation.status];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '620px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="flex items-center gap-2"><ClipboardList size={16} strokeWidth={1.5} /> {reservation.reservationNumber}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span className={`badge ${s.badge} inline-flex items-center gap-1`}><s.Icon size={12} strokeWidth={1.5} /> {s.label}</span>
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
                <div style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={11} strokeWidth={2} /> Départ</div>
                <div style={{ fontSize: '0.9rem', marginTop: '2px' }}>{reservation.departureAddress}</div>
              </div>
              <div style={{ color: 'var(--color-gray)' }}>→</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-error)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={11} strokeWidth={2} /> Arrivée</div>
                <div style={{ fontSize: '0.9rem', marginTop: '2px' }}>{reservation.arrivalAddress}</div>
              </div>
            </div>
            <div style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--color-gray)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={13} strokeWidth={1.5} /> {new Date(reservation.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {reservation.time}
            </div>
          </div>

          {reservation.comments && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '12px', borderRadius: 'var(--radius)', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.78rem', color: '#92400e', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><MessageSquare size={11} strokeWidth={1.5} /> Commentaires</div>
              <div style={{ fontSize: '0.9rem' }}>{reservation.comments}</div>
            </div>
          )}

          {reservation.estimatedPrice && !reservation.price && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '12px', borderRadius: 'var(--radius)', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.78rem', color: '#92400e', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Calculator size={11} strokeWidth={1.5} /> Prix estimé</div>
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
              <div style={{ fontSize: '0.78rem', color: '#065f46', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Euro size={11} strokeWidth={1.5} /> Montant final</div>
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
            <div className="alert alert-error" style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={14} strokeWidth={1.5} /> {actionError}</div>
          )}

          {/* Actions statut */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
            {reservation.status === 'pending' && (
              <button className="btn btn-sm" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => updateStatus('confirmed')} disabled={loading}>
                <CheckCircle size={13} strokeWidth={1.5} /> Confirmer
              </button>
            )}
            {reservation.status !== 'cancelled' && reservation.status !== 'completed' && (
              <button className="btn btn-sm" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => updateStatus('cancelled')} disabled={loading}>
                <XCircle size={13} strokeWidth={1.5} /> Annuler
              </button>
            )}
          </div>

          {/* Téléchargements PDF */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
            <button className="btn btn-sm btn-dark" style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => downloadPdf('reservation')}>
              <FileText size={13} strokeWidth={1.5} /> Bon réservation
            </button>
            {reservation.status === 'completed' && reservation.price && (
              <button className="btn btn-sm" style={{ background: 'var(--color-accent)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => downloadPdf('invoice')}>
                <Receipt size={13} strokeWidth={1.5} /> Facture PDF
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   CrmView — Suivi clients
   ───────────────────────────────────────────────────────────────────────────── */

function CrmView({ showToast }) {
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

  const formatDate = (d) => d
    ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';

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

/* ─────────────────────────────────────────────────────────────────────────────
   AdminView — Panel super-admin
   ───────────────────────────────────────────────────────────────────────────── */

const STATUS_DRIVER_META = {
  trial:     { label: 'Essai',    color: '#D4AF37' },
  active:    { label: 'Actif',    color: '#22c55e' },
  suspended: { label: 'Suspendu', color: '#f97316' },
  expired:   { label: 'Expiré',   color: '#ef4444' },
};

function AdminView({ showToast }) {
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
                          {d.status !== 'active' && (
                            <button
                              className="btn btn-sm"
                              style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => handleStatusChange(d.id, 'active')}
                              disabled={isActioning}
                            >
                              <UserCheck size={12} strokeWidth={1.5} /> Activer
                            </button>
                          )}
                          {d.status !== 'suspended' && (
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

/* ─────────────────────────────────────────────────────────────────────────────
   SubscriptionView — Onglet Abonnement
   ───────────────────────────────────────────────────────────────────────────── */
function SubscriptionView({ showToast, driver }) {
  const [billing, setBilling]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    billingAPI.getInfo()
      .then(({ data }) => setBilling(data))
      .catch(() => showToast('Impossible de charger les informations d\'abonnement.', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleCheckout = async (interval) => {
    setActionLoading(true);
    try {
      const { data } = await billingAPI.createCheckout(interval);
      window.location.href = data.url;
    } catch {
      showToast('Erreur lors de la création de la session de paiement.', 'error');
      setActionLoading(false);
    }
  };

  const handlePortal = async () => {
    setActionLoading(true);
    try {
      const { data } = await billingAPI.createPortal();
      window.location.href = data.url;
    } catch {
      showToast('Erreur lors de l\'ouverture du portail de gestion.', 'error');
      setActionLoading(false);
    }
  };

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;

  const isTrial    = billing?.status === 'trial';
  const isActive   = billing?.status === 'active';
  const isExpired  = billing?.status === 'expired' || billing?.status === 'suspended';
  const daysLeft   = billing?.trialDaysLeft ?? 0;
  const urgency    = daysLeft <= 3;

  // Badge couleur selon statut
  const statusColor = isActive ? '#22c55e' : isTrial ? (urgency ? '#f97316' : '#D4AF37') : '#ef4444';
  const statusLabel = isActive
    ? (billing.plan === 'pro' ? 'Pro — Actif' : 'Actif')
    : isTrial ? `Essai gratuit — ${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}`
    : billing?.status === 'suspended' ? 'Compte suspendu' : 'Abonnement expiré';

  return (
    <div style={{ maxWidth: '680px' }}>

      {/* Carte statut */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-body" style={{ padding: '28px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-gray)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                Statut de votre compte
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  display: 'inline-block', padding: '4px 14px', borderRadius: '999px',
                  background: `${statusColor}18`, color: statusColor,
                  fontSize: '0.85rem', fontWeight: '700', border: `1px solid ${statusColor}40`,
                }}>
                  {statusLabel}
                </span>
              </div>
              {isActive && billing?.currentPeriodEnd && (
                <div style={{ marginTop: '8px', fontSize: '0.82rem', color: 'var(--color-gray)' }}>
                  Prochain renouvellement : <strong style={{ color: 'var(--color-white)' }}>
                    {new Date(billing.currentPeriodEnd).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </strong>
                  {billing.cancelAtPeriodEnd && (
                    <span style={{ marginLeft: '8px', color: '#f97316', fontSize: '0.8rem' }}>(annulation prévue)</span>
                  )}
                </div>
              )}
              {isTrial && (
                <div style={{ marginTop: '8px', fontSize: '0.82rem', color: urgency ? '#f97316' : 'var(--color-gray)' }}>
                  {urgency
                    ? <><AlertTriangle size={13} strokeWidth={1.5} style={{ display: 'inline', marginRight: '4px' }} />Votre essai expire bientôt — passez à Pro pour continuer.</>
                    : <>Profitez de toutes les fonctionnalités pendant votre période d'essai.</>}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-gray)', marginBottom: '4px' }}>Plan</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: billing?.plan === 'pro' ? 'var(--color-accent)' : 'var(--color-white)' }}>
                {billing?.plan === 'pro' ? 'Pro' : 'Gratuit'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Offre Pro — affichée si trial ou expiré */}
      {(isTrial || isExpired) && (
        <div className="card card-glass-gold" style={{ marginBottom: '24px' }}>
          <div className="card-body" style={{ padding: '28px 32px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
              Passez à Pro
            </div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px', color: 'var(--color-white)' }}>
              3M Drive Pro
            </h3>
            <p style={{ color: 'var(--color-gray)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.6' }}>
              Accédez à toutes les fonctionnalités sans limite : réservations illimitées, statistiques avancées, factures PDF, export de données.
            </p>

            {/* Avantages */}
            <div style={{ display: 'grid', gap: '10px', marginBottom: '28px' }}>
              {[
                { Icon: Zap,    text: 'Réservations illimitées' },
                { Icon: Shield, text: 'Statistiques & analytics avancés' },
                { Icon: FileText, text: 'Factures PDF automatiques par email' },
                { Icon: CreditCard, text: 'Gestion d\'abonnement en libre-service' },
              ].map(({ Icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: 'rgba(255,255,255,0.85)' }}>
                  <Icon size={15} strokeWidth={1.5} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                  {text}
                </div>
              ))}
            </div>

            {/* Boutons prix */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                onClick={() => handleCheckout('month')}
                disabled={actionLoading}
                style={{ flex: '1', minWidth: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {actionLoading
                  ? <><RefreshCw size={15} strokeWidth={1.5} className="animate-spin" /> Redirection…</>
                  : <><Zap size={15} strokeWidth={1.5} /> Mensuel</>}
              </button>
              <button
                className="btn"
                onClick={() => handleCheckout('year')}
                disabled={actionLoading}
                style={{ flex: '1', minWidth: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(212,175,55,0.12)', color: 'var(--color-accent)', border: '1px solid rgba(212,175,55,0.3)' }}
              >
                {actionLoading
                  ? <><RefreshCw size={15} strokeWidth={1.5} className="animate-spin" /> Redirection…</>
                  : <><Zap size={15} strokeWidth={1.5} /> Annuel (économisez 2 mois)</>}
              </button>
            </div>
            <p style={{ marginTop: '12px', fontSize: '0.78rem', color: 'var(--color-gray)' }}>
              Paiement sécurisé via Stripe. Résiliable à tout moment.
            </p>
          </div>
        </div>
      )}

      {/* Gestion abonnement actif */}
      {isActive && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-body" style={{ padding: '28px 32px' }}>
            <h3 style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={16} strokeWidth={1.5} style={{ color: 'var(--color-accent)' }} />
              Gérer mon abonnement
            </h3>
            <p style={{ color: 'var(--color-gray)', fontSize: '0.88rem', marginBottom: '20px' }}>
              Modifiez votre plan, vos informations de paiement ou résiliez depuis le portail sécurisé Stripe.
            </p>
            <button
              className="btn btn-dark"
              onClick={handlePortal}
              disabled={actionLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {actionLoading
                ? <><RefreshCw size={15} strokeWidth={1.5} className="animate-spin" /> Redirection…</>
                : <><ExternalLink size={15} strokeWidth={1.5} /> Ouvrir le portail de facturation</>}
            </button>
          </div>
        </div>
      )}

      {/* Info aide */}
      <div style={{ fontSize: '0.8rem', color: 'var(--color-gray)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <Shield size={13} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: '1px' }} />
        <span>Vos données de paiement sont traitées exclusivement par Stripe. 3M Drive ne stocke aucune information bancaire.</span>
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
  const [unreadCount, setUnreadCount] = useState(0);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
  };

  const loadStats = useCallback(async () => {
    try {
      const { data } = await statsAPI.get();
      setStats(data);
    } catch {
      showToast('Impossible de charger les statistiques.', 'error');
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
      showToast('Impossible de charger les réservations.', 'error');
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

  // Rediriger vers l'onglet abonnement si le backend renvoie un 402
  useEffect(() => {
    const handler = () => setView('abonnement');
    window.addEventListener('subscription:required', handler);
    return () => window.removeEventListener('subscription:required', handler);
  }, []);

  // ── Notifications SSE temps réel ────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('vtc_token');
    if (!token) return;

    const es = new EventSource(`/api/notifications/stream?token=${encodeURIComponent(token)}`);

    es.addEventListener('new_reservation', (e) => {
      try {
        const data = JSON.parse(e.data);
        const label = data.firstName && data.lastName
          ? `${data.firstName} ${data.lastName}`
          : 'Nouveau client';
        showToast(`Nouvelle réservation — ${label} · ${data.departureAddress}`, 'success');
        setUnreadCount(c => c + 1);
        loadReservations();
        loadStats();
      } catch (_) {}
    });

    es.onerror = () => {
      // L'EventSource reconnecte automatiquement — pas d'action requise
    };

    return () => es.close();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleCompleteSuccess = (data) => {
    setCompleteReservation(null);
    showToast(
      data.invoicePdfUrl
        ? 'Course validée ! Facture PDF générée et envoyée au client.'
        : 'Course validée.',
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
        <div className="fixed top-6 right-6 z-[9999] flex items-center gap-3 max-w-[360px] px-5 py-3.5 rounded-lg shadow-lg text-sm font-medium"
          style={{
            background: 'var(--color-secondary)',
            color: 'var(--color-white)',
            borderLeft: `4px solid ${toast.type === 'error' ? 'var(--color-error)' : 'var(--color-accent)'}`,
          }}>
          {toast.type === 'error'
            ? <AlertTriangle size={15} strokeWidth={1.5} className="shrink-0" style={{ color: 'var(--color-error)' }} />
            : <CheckCircle size={15} strokeWidth={1.5} className="shrink-0" style={{ color: 'var(--color-accent)' }} />}
          {toast.msg}
        </div>
      )}

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo flex items-center gap-2">
          <Car size={20} strokeWidth={1.5} /> VTC 3M
        </div>
        <nav className="sidebar-nav">
          {[
            { id: 'dashboard',    Icon: LayoutDashboard, label: 'Tableau de bord' },
            { id: 'reservations', Icon: ClipboardList,   label: 'Réservations' },
            { id: 'stats',        Icon: TrendingUp,      label: 'Statistiques' },
            { id: 'calculateur',  Icon: Calculator,      label: 'Calculateur prix' },
            { id: 'clients',      Icon: Users2,          label: 'Clients (CRM)' },
            { id: 'abonnement',   Icon: CreditCard,      label: 'Abonnement' },
            { id: 'settings',     Icon: Settings,        label: 'Paramètres' },
            ...(driver?.role === 'admin' ? [{ id: 'admin', Icon: Users, label: 'Administration' }] : []),
          ].map(item => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${view === item.id ? 'active' : ''}`}
              onClick={() => {
                setView(item.id);
                if (item.id === 'reservations') setUnreadCount(0);
              }}
            >
              <span className="icon"><item.Icon size={17} strokeWidth={1.5} /></span>
              {item.label}
              {item.id === 'reservations' && unreadCount > 0 && (
                <span style={{
                  marginLeft: 'auto', minWidth: '20px', height: '20px',
                  background: 'var(--color-accent)', color: '#000',
                  borderRadius: '999px', fontSize: '0.7rem', fontWeight: '800',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 5px',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>
            Connecté en tant que<br />
            <strong style={{ color: 'var(--color-accent)' }}>{driver?.name}</strong>
          </div>
          <button className="sidebar-nav-item" onClick={handleLogout} style={{ color: '#ef4444', width: '100%' }}>
            <span className="icon"><LogOut size={17} strokeWidth={1.5} /></span>
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
                              <td><span className={`badge ${s.badge} inline-flex items-center gap-1`}><s.Icon size={12} strokeWidth={1.5} /> {s.label}</span></td>
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
              <h1 className="flex items-center gap-2"><ClipboardList size={22} strokeWidth={1.5} /> Réservations</h1>
              <p>Gérez toutes vos courses ({total} au total)</p>
            </div>

            <div className="filters-bar">
              <input
                className="search-input"
                type="search"
                placeholder="Rechercher (nom, email, numéro…)"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
              <select
                className="filter-select"
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmées</option>
                <option value="completed">Terminées</option>
                <option value="cancelled">Annulées</option>
              </select>
            </div>

            <div className="card">
              <div className="table-container">
                {loadingData ? (
                  <div className="loader-container"><div className="loader"></div></div>
                ) : reservations.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-gray)' }}>
                    <Inbox size={40} strokeWidth={1} style={{ margin: '0 auto 16px', color: 'var(--color-gray)' }} />
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
                              <div style={{ fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block', flexShrink: 0 }}></span> {r.departureAddress}
                              </div>
                              <div style={{ fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-error)', display: 'inline-block', flexShrink: 0 }}></span> {r.arrivalAddress}
                              </div>
                            </td>
                            <td><span className={`badge ${s.badge} inline-flex items-center gap-1`}><s.Icon size={12} strokeWidth={1.5} /> {s.label}</span></td>
                            <td>{r.price ? `${Number(r.price).toFixed(2)} €` : '—'}</td>
                            <td>
                              <div className="actions">
                                <button className="btn btn-sm btn-dark" onClick={() => setSelectedReservation(r)}>
                                  Détails
                                </button>
                                {(r.status === 'pending' || r.status === 'confirmed') && (
                                  <button
                                    className="btn btn-sm"
                                    style={{ background: 'var(--color-success)', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    onClick={() => setCompleteReservation(r)}
                                  >
                                    <Flag size={13} strokeWidth={1.5} /> Valider
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
              <h1 className="flex items-center gap-2"><TrendingUp size={22} strokeWidth={1.5} /> Statistiques</h1>
              <p>Vue d'ensemble de votre activité</p>
            </div>
            {stats ? (
              <div style={{ display: 'grid', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                  {[
                    { label: 'Revenus totaux',      value: `${Number(stats.revenue.allTime || 0).toFixed(2)} €`, Icon: Euro,         color: '#D4AF37' },
                    { label: 'Revenus ce mois',     value: `${Number(stats.revenue.month  || 0).toFixed(2)} €`, Icon: Calendar,     color: '#10b981' },
                    { label: 'Revenus cette année', value: `${Number(stats.revenue.year   || 0).toFixed(2)} €`, Icon: TrendingUp,   color: '#3b82f6' },
                    { label: 'Taux de réussite',    value: `${stats.counts.total > 0 ? Math.round((stats.counts.completed / stats.counts.total) * 100) : 0}%`, Icon: Flag, color: '#8b5cf6' },
                  ].map((item, i) => (
                    <div key={i} className="card" style={{ padding: '24px' }}>
                      <item.Icon size={28} strokeWidth={1.5} style={{ color: item.color, marginBottom: '8px' }} />
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

        {/* ── VUE CALCULATEUR PRIX ── */}
        {view === 'calculateur' && (
          <>
            <div className="dashboard-header">
              <h1 className="flex items-center gap-2"><Calculator size={22} strokeWidth={1.5} /> Calculateur de prix</h1>
              <p>Estimez le tarif d'une course en fonction de vos charges réelles et de la marge souhaitée</p>
            </div>
            <PrixCalculateur />
          </>
        )}

        {/* ── VUE CLIENTS CRM ── */}
        {view === 'clients' && (
          <>
            <div className="dashboard-header">
              <h1 className="flex items-center gap-2"><Users2 size={22} strokeWidth={1.5} /> Clients (CRM)</h1>
              <p>Historique et fidélisation de votre clientèle</p>
            </div>
            <CrmView showToast={showToast} />
          </>
        )}

        {/* ── VUE ADMINISTRATION ── */}
        {view === 'admin' && driver?.role === 'admin' && (
          <>
            <div className="dashboard-header">
              <h1 className="flex items-center gap-2"><Users size={22} strokeWidth={1.5} /> Administration</h1>
              <p>Vue globale de la plateforme 3M Drive</p>
            </div>
            <AdminView showToast={showToast} />
          </>
        )}

        {/* ── VUE ABONNEMENT ── */}
        {view === 'abonnement' && (
          <>
            <div className="dashboard-header">
              <h1 className="flex items-center gap-2"><CreditCard size={22} strokeWidth={1.5} /> Abonnement</h1>
              <p>Gérez votre plan et vos informations de facturation</p>
            </div>
            <SubscriptionView showToast={showToast} driver={driver} />
          </>
        )}

        {/* ── VUE PARAMÈTRES ── */}
        {view === 'settings' && (
          <>
            <div className="dashboard-header">
              <h1 className="flex items-center gap-2"><Settings size={22} strokeWidth={1.5} /> Paramètres</h1>
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

/* ─────────────────────────────────────────────────────────────────────────────
   Calculateur de prix – 3M Drive
   Logique :
     Coût fixe ramené à la course  = (charges_fixes_mois / km_mois) × distance
     Coût variable                 = charges_var_km × distance
     Coût temps                    = (durée_min / 60) × coût_horaire
     Prix de revient               = fixe + variable + temps
     Prix final                    = prix_de_revient × (1 + marge / 100)
   ───────────────────────────────────────────────────────────────────────────── */

const CALC_STORAGE_KEY = '3mdrive_calc_params';

const DEFAULT_PARAMS = {
  chargesFixesMois: 800,   // € / mois (assurance, amortissement, abonnements)
  chargesVarKm: 0.18,      // € / km   (carburant, entretien, pneus)
  coutHoraire: 25,         // € / h    (valorisation temps chauffeur)
  kmMoyensMois: 3000,      // km / mois (base de répartition des fixes)
};

function PrixCalculateur() {
  // ── Paramètres tarifaires (persistés en localStorage) ──
  const [params, setParams] = useState(() => {
    try {
      const saved = localStorage.getItem(CALC_STORAGE_KEY);
      return saved ? { ...DEFAULT_PARAMS, ...JSON.parse(saved) } : DEFAULT_PARAMS;
    } catch {
      return DEFAULT_PARAMS;
    }
  });
  const [paramsSaved, setParamsSaved] = useState(false);

  // ── Inputs de simulation ──
  const [sim, setSim] = useState({
    typeService: 'course',  // 'course' | 'mise_a_disposition'
    distance: '',
    duree: '',
    marge: 30,
  });

  // ── Calcul dynamique ──
  const result = (() => {
    const dist = parseFloat(sim.distance);
    const dur  = parseFloat(sim.duree);
    const marge = parseFloat(sim.marge) || 0;

    if (!dist || dist <= 0 || !dur || dur <= 0) return null;

    const coutFixe    = (params.chargesFixesMois / params.kmMoyensMois) * dist;
    const coutVar     = params.chargesVarKm * dist;
    const coutTemps   = (dur / 60) * params.coutHoraire;
    const prixRevient = coutFixe + coutVar + coutTemps;
    const prixFinal   = prixRevient * (1 + marge / 100);
    const prixKm      = prixFinal / dist;
    const prixMin     = prixFinal / dur;
    const margeEuros  = prixFinal - prixRevient;

    return {
      prixRevient: prixRevient.toFixed(2),
      prixFinal:   prixFinal.toFixed(2),
      prixKm:      prixKm.toFixed(2),
      prixMin:     prixMin.toFixed(2),
      margeEuros:  margeEuros.toFixed(2),
      coutFixe:    coutFixe.toFixed(2),
      coutVar:     coutVar.toFixed(2),
      coutTemps:   coutTemps.toFixed(2),
    };
  })();

  const saveParams = () => {
    localStorage.setItem(CALC_STORAGE_KEY, JSON.stringify(params));
    setParamsSaved(true);
    setTimeout(() => setParamsSaved(false), 2000);
  };

  const resetParams = () => {
    setParams(DEFAULT_PARAMS);
    localStorage.removeItem(CALC_STORAGE_KEY);
  };

  const resetSim = () => setSim({ typeService: 'course', distance: '', duree: '', marge: 30 });

  const setParam = (key, val) => setParams(p => ({ ...p, [key]: parseFloat(val) || 0 }));
  const setSf    = (key, val) => setSim(s => ({ ...s, [key]: val }));

  return (
    <div className="calc-layout">

      {/* ── COLONNE GAUCHE : Paramètres de tarification ── */}
      <div>
        <div className="card calc-card">
          <div className="card-header calc-card-header">
            <h3 className="flex items-center gap-2"><Settings size={15} strokeWidth={1.5} /> Paramètres de tarification</h3>
            <span className="calc-hint">Sauvegardés localement</span>
          </div>
          <div className="card-body">

            <div className="calc-param-group">
              <p className="calc-group-label">Charges fixes</p>
              <div className="form-group">
                <label className="form-label">Charges fixes / mois (€)</label>
                <input type="number" className="form-control" min="0" step="10"
                  value={params.chargesFixesMois}
                  onChange={e => setParam('chargesFixesMois', e.target.value)} />
                <span className="calc-field-hint">Assurance, amortissement véhicule, abonnements…</span>
              </div>
              <div className="form-group">
                <label className="form-label">Kilomètres moyens / mois</label>
                <input type="number" className="form-control" min="1" step="100"
                  value={params.kmMoyensMois}
                  onChange={e => setParam('kmMoyensMois', e.target.value)} />
                <span className="calc-field-hint">Sert à ramener les charges fixes au km</span>
              </div>
            </div>

            <div className="calc-param-group">
              <p className="calc-group-label">Charges variables</p>
              <div className="form-group">
                <label className="form-label">Coût variable / km (€)</label>
                <input type="number" className="form-control" min="0" step="0.01"
                  value={params.chargesVarKm}
                  onChange={e => setParam('chargesVarKm', e.target.value)} />
                <span className="calc-field-hint">Carburant, entretien, pneumatiques…</span>
              </div>
            </div>

            <div className="calc-param-group">
              <p className="calc-group-label">Valorisation du temps</p>
              <div className="form-group">
                <label className="form-label">Coût horaire chauffeur (€/h)</label>
                <input type="number" className="form-control" min="0" step="1"
                  value={params.coutHoraire}
                  onChange={e => setParam('coutHoraire', e.target.value)} />
                <span className="calc-field-hint">Rémunération nette souhaitée par heure</span>
              </div>
            </div>

            {/* Résumé coût fixe au km */}
            <div className="calc-summary-row">
              <span>Coût fixe ramené au km</span>
              <strong className="calc-accent">
                {params.kmMoyensMois > 0
                  ? (params.chargesFixesMois / params.kmMoyensMois).toFixed(3)
                  : '—'} €/km
              </strong>
            </div>
            <div className="calc-summary-row">
              <span>Coût total au km (hors temps)</span>
              <strong className="calc-accent">
                {params.kmMoyensMois > 0
                  ? (params.chargesFixesMois / params.kmMoyensMois + params.chargesVarKm).toFixed(3)
                  : '—'} €/km
              </strong>
            </div>

            <div className="calc-actions">
              <button className="btn btn-primary" onClick={saveParams}>
                {paramsSaved ? <><CheckCircle size={14} strokeWidth={1.5} /> Sauvegardé !</> : <><Settings size={14} strokeWidth={1.5} /> Sauvegarder</>}
              </button>
              <button className="btn btn-outline calc-btn-reset" onClick={resetParams}>
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── COLONNE DROITE : Simulation + Résultats ── */}
      <div className="calc-right">

        {/* Simulation */}
        <div className="card calc-card">
          <div className="card-header calc-card-header">
            <h3 className="flex items-center gap-2"><Calculator size={15} strokeWidth={1.5} /> Simulation de course</h3>
            <button className="calc-link" onClick={resetSim}>Réinitialiser</button>
          </div>
          <div className="card-body">

            {/* Type de service */}
            <div className="form-group">
              <label className="form-label">Type de service</label>
              <div className="calc-type-toggle">
                {[
                  { value: 'course', label: 'Course', desc: 'Trajet A → B' },
                  { value: 'mise_a_disposition', label: 'Mise à disposition', desc: 'Durée fixe' },
                ].map(t => (
                  <button
                    key={t.value}
                    className={`calc-type-btn ${sim.typeService === t.value ? 'active' : ''}`}
                    onClick={() => setSf('typeService', t.value)}
                    type="button"
                  >
                    <span className="calc-type-label">{t.label}</span>
                    <span className="calc-type-desc">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="calc-inputs-grid">
              <div className="form-group">
                <label className="form-label">Distance (km)</label>
                <input type="number" className="form-control" min="1" step="1"
                  placeholder="Ex : 42"
                  value={sim.distance}
                  onChange={e => setSf('distance', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Durée estimée (min)</label>
                <input type="number" className="form-control" min="1" step="5"
                  placeholder="Ex : 55"
                  value={sim.duree}
                  onChange={e => setSf('duree', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Marge souhaitée (%)</label>
                <input type="number" className="form-control" min="0" max="200" step="5"
                  value={sim.marge}
                  onChange={e => setSf('marge', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Résultats */}
        {result ? (
          <div className="card calc-card calc-results-card">
            <div className="card-header calc-card-header">
              <h3 className="flex items-center gap-2"><TrendingUp size={15} strokeWidth={1.5} /> Résultats</h3>
              <span className="calc-hint">Calcul en temps réel</span>
            </div>
            <div className="card-body">

              {/* Prix principal */}
              <div className="calc-price-hero">
                <div>
                  <div className="calc-price-label">Prix final client</div>
                  <div className="calc-price-value">{result.prixFinal} €</div>
                </div>
                <div className="calc-price-sub">
                  <div className="calc-kpi">
                    <span className="calc-kpi-val">{result.prixKm} €</span>
                    <span className="calc-kpi-label">/ km</span>
                  </div>
                  <div className="calc-kpi">
                    <span className="calc-kpi-val">{result.prixMin} €</span>
                    <span className="calc-kpi-label">/ min</span>
                  </div>
                </div>
              </div>

              {/* Décomposition */}
              <div className="calc-breakdown">
                <p className="calc-group-label">Décomposition du coût</p>
                {[
                  { label: `Charges fixes (${sim.distance} km)`, value: `${result.coutFixe} €` },
                  { label: `Charges variables (${result.coutVar} €)`, value: `${result.coutVar} €` },
                  { label: `Temps (${sim.duree} min)`, value: `${result.coutTemps} €` },
                ].map((row, i) => (
                  <div key={i} className="calc-breakdown-row">
                    <span>{row.label}</span>
                    <span>{row.value}</span>
                  </div>
                ))}
                <div className="calc-breakdown-row calc-breakdown-total">
                  <span>Prix de revient</span>
                  <span>{result.prixRevient} €</span>
                </div>
                <div className="calc-breakdown-row calc-breakdown-marge">
                  <span>Marge ({sim.marge}%)</span>
                  <span>+ {result.margeEuros} €</span>
                </div>
                <div className="calc-breakdown-row calc-breakdown-final">
                  <span>Prix final</span>
                  <strong>{result.prixFinal} €</strong>
                </div>
              </div>

              {/* Indication type */}
              <div className="calc-service-badge">
                {sim.typeService === 'course' ? 'Course simple' : 'Mise à disposition'}
                &nbsp;·&nbsp;{sim.distance} km&nbsp;·&nbsp;{sim.duree} min&nbsp;·&nbsp;marge {sim.marge}%
              </div>

            </div>
          </div>
        ) : (
          <div className="card calc-card calc-empty">
            <div className="calc-empty-icon"><Calculator size={36} strokeWidth={1} /></div>
            <p>Renseignez la distance et la durée<br />pour obtenir le calcul du prix.</p>
          </div>
        )}
      </div>
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
      showToast('Mot de passe modifié avec succès.');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du changement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '480px' }}>
      <div className="card-header"><h3 style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}><Settings size={16} strokeWidth={1.5} /> Changer le mot de passe</h3></div>
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
            {loading ? <><Clock size={14} className="animate-spin" /> ...</> : <><CheckCircle size={14} strokeWidth={1.5} /> Enregistrer</>}
          </button>
        </form>
      </div>
    </div>
  );
}
