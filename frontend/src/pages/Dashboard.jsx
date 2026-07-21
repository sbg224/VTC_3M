import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, TrendingUp, Calculator, Home,
  Settings, LogOut, Clock, CheckCircle, Flag, XCircle, Euro,
  Inbox, Search, MessageSquare, FileText, Receipt, AlertTriangle,
  MapPin, Calendar, ChevronLeft, ChevronRight,
  CreditCard, Zap, Shield, RefreshCw, ExternalLink,
  Users, BarChart3, Ban, UserCheck, Copy, Link,
  Users2, Download, Phone, Mail, Star, ArrowUp, ArrowDown, Minus, MoreHorizontal,
} from 'lucide-react';
import { useAuth } from '../services/auth';
import { reservationAPI, statsAPI, adminAPI, reviewAPI } from '../services/api';
import { STATUS_LABELS } from './dashboard-views/statusLabels';
import StatCard from './dashboard-views/StatCard';
import PerfCard from './dashboard-views/PerfCard';
import StarsDisplay from './dashboard-views/StarsDisplay';
import CompleteModal from './dashboard-views/CompleteModal';
import ReservationDetail from './dashboard-views/ReservationDetail';
import CrmView from './dashboard-views/CrmView';
import AdminView from './dashboard-views/AdminView';
import SubscriptionView from './dashboard-views/SubscriptionView';
import PrixCalculateur from './dashboard-views/PrixCalculateur';
import ChangePasswordForm from './dashboard-views/ChangePasswordForm';

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
  const [pendingDriversCount, setPendingDriversCount] = useState(0);
  const [moreOpen, setMoreOpen] = useState(false);

  // ── Planning hebdomadaire ──────────────────────────────────────────────────
  const [planningWeekOffset, setPlanningWeekOffset] = useState(0); // 0=semaine courante
  const [planningRides, setPlanningRides]           = useState([]);
  const [planningLoading, setPlanningLoading]       = useState(false);

  // ── Avis clients ──────────────────────────────────────────────────────────
  const [reviews, setReviews]           = useState([]);
  const [reviewsMeta, setReviewsMeta]   = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);

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

  // ── Planning : dates de la semaine affichée ──────────────────────────────
  const getWeekDates = useCallback((offset = 0) => {
    const now = new Date();
    const day = now.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMon + offset * 7);
    monday.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, []);

  const loadPlanning = useCallback(async (offset) => {
    setPlanningLoading(true);
    try {
      const days = getWeekDates(offset);
      const dateFrom = days[0].toISOString().slice(0, 10);
      const dateTo   = days[6].toISOString().slice(0, 10);
      const { data } = await reservationAPI.getAll({ dateFrom, dateTo, limit: 100, status: 'all' });
      setPlanningRides(data.reservations || []);
    } catch { /* silencieux */ } finally { setPlanningLoading(false); }
  }, [getWeekDates]);

  const loadReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const { data } = await reviewAPI.getDriverReviews({ limit: 20 });
      setReviews(data.reviews || []);
      setReviewsMeta({ average: data.average, total: data.total, distribution: data.distribution });
    } catch { /* silencieux */ } finally { setReviewsLoading(false); }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Charger le nb de chauffeurs en attente (admins uniquement)
  useEffect(() => {
    if (driver?.role !== 'admin') return;
    adminAPI.getGlobalStats()
      .then(({ data }) => setPendingDriversCount(data.drivers.byStatus.pending || 0))
      .catch(() => {});
  }, [driver?.role]);

  useEffect(() => {
    if (view === 'reservations' || view === 'dashboard') loadReservations();
    if (view === 'planning') loadPlanning(planningWeekOffset);
    if (view === 'avis') loadReviews();
  }, [view]); // eslint-disable-line

  useEffect(() => {
    if (view === 'planning') loadPlanning(planningWeekOffset);
  }, [planningWeekOffset]); // eslint-disable-line

  // Rediriger vers l'onglet abonnement si le backend renvoie un 402
  useEffect(() => {
    const handler = () => setView('abonnement');
    window.addEventListener('subscription:required', handler);
    return () => window.removeEventListener('subscription:required', handler);
  }, []);

  // ── Notifications SSE temps réel ────────────────────────────────────────────
  // Le cookie de session httpOnly est envoyé automatiquement par EventSource
  // pour une requête même origine — plus besoin de token dans l'URL.
  useEffect(() => {
    const es = new EventSource('/api/notifications/stream');

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

  const handleCompleteSuccess = () => {
    setCompleteReservation(null);
    showToast('Course validée ! Facture envoyée au client par email.', 'success');
    loadReservations();
    loadStats();
  };

  return (
    <div className="dashboard">
      {/* Toast */}
      {toast.msg && (
        <div className="toast-notification"
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

      {/* Navigation flottante */}
      {moreOpen && <div className="bottom-nav-backdrop" onClick={() => setMoreOpen(false)} />}
      <nav className="bottom-nav" aria-label="Navigation du tableau de bord">
        {[
          { id: 'dashboard',    Icon: LayoutDashboard, label: 'Tableau de bord' },
          { id: 'reservations', Icon: ClipboardList,   label: 'Réservations' },
          { id: 'calculateur',  Icon: Calculator,      label: 'Calculateur' },
          { id: 'stats',        Icon: TrendingUp,      label: 'Statistiques' },
        ].map(item => (
          <button
            key={item.id}
            className={`bottom-nav-item ${view === item.id ? 'active' : ''}`}
            onClick={() => {
              setView(item.id);
              setMoreOpen(false);
              if (item.id === 'reservations') setUnreadCount(0);
            }}
          >
            <item.Icon size={18} strokeWidth={1.75} />
            <span className="bottom-nav-label">{item.label}</span>
            {item.id === 'reservations' && unreadCount > 0 && (
              <span className="bottom-nav-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>
        ))}

        <div className="bottom-nav-divider" />

        <div style={{ position: 'relative' }}>
          <button
            className={`bottom-nav-icon-btn ${moreOpen ? 'active' : ''}`}
            onClick={() => setMoreOpen(o => !o)}
            aria-label="Plus d'options"
          >
            <MoreHorizontal size={18} strokeWidth={1.75} />
            {(pendingDriversCount > 0 && driver?.role === 'admin') && <span className="bottom-nav-dot" />}
          </button>

          {moreOpen && (
            <div className="bottom-nav-more-panel">
              <button
                onClick={() => { navigate('/'); setMoreOpen(false); }}
                title="Retour à l'accueil"
                aria-label="Retour à l'accueil"
                style={{ display:'flex', alignItems:'center', padding:'8px 12px 12px' }}
              >
                <img src="/images/nav-logo-dark.webp" alt="3M Drive" style={{ height:32, width:'auto', objectFit:'contain' }} />
              </button>
              <div className="bottom-nav-more-divider" />
              {[
                { id: 'planning',    Icon: Calendar,   label: 'Planning' },
                { id: 'avis',        Icon: Star,       label: 'Avis clients' },
                { id: 'clients',     Icon: Users2,     label: 'Clients (CRM)' },
                { id: 'abonnement',  Icon: CreditCard, label: 'Abonnement' },
                { id: 'settings',    Icon: Settings,   label: 'Paramètres' },
                ...(driver?.role === 'admin' ? [{ id: 'admin', Icon: Users, label: 'Administration', badge: pendingDriversCount }] : []),
              ].map(item => (
                <button
                  key={item.id}
                  className={`bottom-nav-more-item ${view === item.id ? 'active' : ''}`}
                  onClick={() => { setView(item.id); setMoreOpen(false); }}
                >
                  <item.Icon size={16} strokeWidth={1.5} />
                  {item.label}
                  {item.badge > 0 && <span className="bottom-nav-more-badge">{item.badge > 9 ? '9+' : item.badge}</span>}
                </button>
              ))}
              <div className="bottom-nav-more-divider" />
              <button className="bottom-nav-more-item" onClick={() => { navigate('/'); setMoreOpen(false); }}>
                <Home size={16} strokeWidth={1.5} />
                Retour à l'accueil
              </button>
              <div className="bottom-nav-more-driver">
                Connecté en tant que <strong>{driver?.name}</strong>
              </div>
              <button className="bottom-nav-more-item logout" onClick={handleLogout}>
                <LogOut size={16} strokeWidth={1.5} />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </nav>

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

                {/* ── Indicateurs de performance M vs M-1 ── */}
                {stats.performance && (
                  <div className="perf-cards">
                    <PerfCard
                      label="Courses ce mois"
                      value={stats.performance.ridesThisMonth}
                      prev={stats.performance.ridesPrevMonth}
                      delta={stats.performance.ridesDelta}
                      icon={<Flag size={16} strokeWidth={1.5} />}
                    />
                    <PerfCard
                      label="Revenus ce mois"
                      value={`${Number(stats.performance.revenueMonth).toFixed(0)} €`}
                      prev={`${Number(stats.performance.revenuePrev).toFixed(0)} €`}
                      delta={stats.performance.revenueDelta}
                      icon={<Euro size={16} strokeWidth={1.5} />}
                    />
                    {stats.reviews?.count > 0 && (
                      <PerfCard
                        label="Note clients"
                        value={`${stats.reviews.average} / 5`}
                        prev={`${stats.reviews.count} avis`}
                        delta={null}
                        icon={<Star size={16} strokeWidth={1.5} />}
                        starValue={stats.reviews.average}
                      />
                    )}
                  </div>
                )}

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
                              <td><span className={`badge ${s.badge}`}><s.Icon size={12} strokeWidth={1.5} /> {s.label}</span></td>
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
              <h1 className="icon-heading"><ClipboardList size={22} strokeWidth={1.5} /> Réservations</h1>
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
                            <td><span className={`badge ${s.badge}`}><s.Icon size={12} strokeWidth={1.5} /> {s.label}</span></td>
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

        {/* ── VUE PLANNING HEBDOMADAIRE ── */}
        {view === 'planning' && (() => {
          const weekDays = getWeekDates(planningWeekOffset);
          const today = new Date().toISOString().slice(0, 10);
          const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
          const STATUS_COLORS = {
            pending:   { bg: 'rgba(245,158,11,0.10)',  border: '#d97706', text: '#92400e' },
            confirmed: { bg: 'rgba(99,102,241,0.10)',  border: '#4f46e5', text: '#3730a3' },
            completed: { bg: 'rgba(16,185,129,0.10)',  border: '#059669', text: '#065f46' },
            cancelled: { bg: 'rgba(239,68,68,0.08)',   border: '#dc2626', text: '#991b1b' },
          };
          const ridesFor = (dateStr) =>
            planningRides.filter(r => r.date === dateStr)
              .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

          const weekLabel = (() => {
            const fmt = d => d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
            return `${fmt(weekDays[0])} – ${fmt(weekDays[6])}`;
          })();

          return (
            <>
              <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h1 className="icon-heading"><Calendar size={22} strokeWidth={1.5} /> Planning hebdomadaire</h1>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.88rem', marginTop: 4 }}>{weekLabel}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button className="btn btn-sm btn-dark" onClick={() => setPlanningWeekOffset(o => o - 1)}>
                    <ChevronLeft size={15} />
                  </button>
                  {planningWeekOffset !== 0 && (
                    <button className="btn btn-sm btn-dark" onClick={() => setPlanningWeekOffset(0)} style={{ fontSize: '0.78rem' }}>
                      Aujourd'hui
                    </button>
                  )}
                  <button className="btn btn-sm btn-dark" onClick={() => setPlanningWeekOffset(o => o + 1)}>
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>

              {planningLoading ? (
                <div className="card" style={{ padding: 48, textAlign: 'center' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--color-accent)', margin: '0 auto' }} />
                </div>
              ) : (
                <div className="planning-grid">
                  {weekDays.map((d, i) => {
                    const dateStr = d.toISOString().slice(0, 10);
                    const isToday = dateStr === today;
                    const rides   = ridesFor(dateStr);
                    return (
                      <div key={i} className={`planning-col${isToday ? ' planning-col--today' : ''}`}>
                        <div className="planning-col-header">
                          <span className="planning-day-name">{DAY_NAMES[i]}</span>
                          <span className={`planning-day-num${isToday ? ' planning-day-num--today' : ''}`}>
                            {d.getDate()}
                          </span>
                          {rides.length > 0 && (
                            <span className="planning-count">{rides.length}</span>
                          )}
                        </div>
                        <div className="planning-col-body">
                          {rides.length === 0 ? (
                            <div className="planning-empty">—</div>
                          ) : rides.map(r => {
                            const c = STATUS_COLORS[r.status] || STATUS_COLORS.pending;
                            return (
                              <div key={r.id} className="planning-ride"
                                style={{ background: c.bg, borderLeft: `3px solid ${c.border}` }}
                                title={`${r.firstName} ${r.lastName} — ${r.departureAddress}`}
                              >
                                {r.time && <div className="planning-ride-time" style={{ color: c.text }}>{r.time}</div>}
                                <div className="planning-ride-client">{r.firstName} {r.lastName?.charAt(0)}.</div>
                                <div className="planning-ride-addr">{(r.departureAddress || '').slice(0, 28)}</div>
                                {r.estimatedPrice && (
                                  <div className="planning-ride-price" style={{ color: c.text }}>
                                    ~{Number(r.estimatedPrice).toFixed(0)} €
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Légende */}
              <div className="planning-legend">
                {[['pending','En attente','#f59e0b'],['confirmed','Confirmée','#6366f1'],['completed','Terminée','#10b981'],['cancelled','Annulée','#ef4444']].map(([s,l,c]) => (
                  <span key={s} className="planning-legend-item">
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: c, display: 'inline-block' }} />
                    {l}
                  </span>
                ))}
              </div>
            </>
          );
        })()}

        {/* ── VUE AVIS CLIENTS ── */}
        {view === 'avis' && (
          <>
            <div className="dashboard-header">
              <h1 className="icon-heading"><Star size={22} strokeWidth={1.5} /> Avis clients</h1>
              <p>Ce que vos clients disent de vous</p>
            </div>

            {reviewsLoading ? (
              <div className="card" style={{ padding: 48, textAlign: 'center' }}>
                <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--color-accent)', margin: '0 auto' }} />
              </div>
            ) : (
              <>
                {/* Résumé note globale */}
                {reviewsMeta && (
                  <div className="reviews-summary-card">
                    <div className="reviews-big-score">
                      <span className="reviews-score-num">{reviewsMeta.average || '—'}</span>
                      <span className="reviews-score-denom">/5</span>
                    </div>
                    <div>
                      <StarsDisplay value={reviewsMeta.average} size={20} />
                      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', marginTop: 4 }}>
                        {reviewsMeta.total} avis reçus
                      </p>
                      {/* Répartition barres */}
                      {reviewsMeta.distribution && (
                        <div className="reviews-dist">
                          {[...reviewsMeta.distribution].reverse().map(d => {
                            const pct = reviewsMeta.total > 0 ? Math.round(d.count / reviewsMeta.total * 100) : 0;
                            return (
                              <div key={d.rating} className="reviews-dist-row">
                                <span className="reviews-dist-label">{d.rating}</span>
                                <Star size={10} strokeWidth={1.5} fill="#267253" color="#267253" />
                                <div className="reviews-dist-bar">
                                  <div style={{ width: `${pct}%`, height: '100%', background: '#267253', borderRadius: 3, transition: 'width 0.4s ease' }} />
                                </div>
                                <span className="reviews-dist-count">{d.count}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Liste des avis */}
                {reviews.length === 0 ? (
                  <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <Star size={36} strokeWidth={1} style={{ color: 'rgba(38,114,83,0.3)', marginBottom: 12 }} />
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                      Aucun avis pour l'instant. Les avis arrivent automatiquement après chaque course terminée.
                    </p>
                  </div>
                ) : (
                  <div className="reviews-list">
                    {reviews.map(r => (
                      <div key={r.id} className="review-card">
                        <div className="review-card-header">
                          <div>
                            <span className="review-client-name">{r.clientName}</span>
                            {r.reservation && (
                              <span className="review-res-num"> · {r.reservation.reservationNumber}</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <StarsDisplay value={r.rating} size={13} />
                            <span className="review-date">
                              {new Date(r.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>
                        {r.reservation && (
                          <div className="review-trip">
                            <MapPin size={11} strokeWidth={1.5} />
                            {r.reservation.departureAddress?.slice(0, 35)} → {r.reservation.arrivalAddress?.slice(0, 30)}
                          </div>
                        )}
                        {r.comment && (
                          <p className="review-comment">"{r.comment}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── VUE STATISTIQUES ── */}
        {view === 'stats' && (
          <>
            <div className="dashboard-header">
              <h1 className="icon-heading"><TrendingUp size={22} strokeWidth={1.5} /> Statistiques</h1>
              <p>Vue d'ensemble de votre activité</p>
            </div>
            {stats ? (
              <div style={{ display: 'grid', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                  {[
                    { label: 'Revenus totaux',      value: `${Number(stats.revenue.allTime || 0).toFixed(2)} €`, Icon: Euro,         color: '#267253' },
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
              <h1 className="icon-heading"><Calculator size={22} strokeWidth={1.5} /> Calculateur de prix</h1>
              <p>Estimez le tarif d'une course en fonction de vos charges réelles et de la marge souhaitée</p>
            </div>
            <PrixCalculateur />
          </>
        )}

        {/* ── VUE CLIENTS CRM ── */}
        {view === 'clients' && (
          <>
            <div className="dashboard-header">
              <h1 className="icon-heading"><Users2 size={22} strokeWidth={1.5} /> Clients (CRM)</h1>
              <p>Historique et fidélisation de votre clientèle</p>
            </div>
            <CrmView showToast={showToast} />
          </>
        )}

        {/* ── VUE ADMINISTRATION ── */}
        {view === 'admin' && driver?.role === 'admin' && (
          <>
            <div className="dashboard-header">
              <h1 className="icon-heading"><Users size={22} strokeWidth={1.5} /> Administration</h1>
              <p>Vue globale de la plateforme 3M Drive</p>
            </div>
            <AdminView showToast={showToast} />
          </>
        )}

        {/* ── VUE ABONNEMENT ── */}
        {view === 'abonnement' && (
          <>
            <div className="dashboard-header">
              <h1 className="icon-heading"><CreditCard size={22} strokeWidth={1.5} /> Abonnement</h1>
              <p>Gérez votre plan et vos informations de facturation</p>
            </div>
            <SubscriptionView showToast={showToast} driver={driver} />
          </>
        )}

        {/* ── VUE PARAMÈTRES ── */}
        {view === 'settings' && (
          <>
            <div className="dashboard-header">
              <h1 className="icon-heading"><Settings size={22} strokeWidth={1.5} /> Paramètres</h1>
              <p>Gérez votre compte</p>
            </div>

            {/* ── Lien de réservation — chauffeurs uniquement ── */}
            {driver?.role === 'driver' && driver?.slug && (
              <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header">
                  <h3 style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Link size={16} strokeWidth={1.5} /> Mon lien de réservation
                  </h3>
                </div>
                <div className="card-body">
                  <p style={{ color: 'var(--color-gray)', fontSize: '0.9rem', marginBottom: '16px' }}>
                    Partagez ce lien à vos clients. Toutes les réservations effectuées via ce lien vous seront directement attribuées.
                  </p>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)',
                    borderRadius: '8px', padding: '12px 16px',
                  }}>
                    <span style={{ flex: 1, fontSize: '0.88rem', color: 'var(--color-white)', wordBreak: 'break-all' }}>
                      {`${window.location.origin}/book/${driver.slug}`}
                    </span>
                    <button
                      className="btn btn-sm"
                      style={{ background: 'var(--color-accent)', color: '#000', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/book/${driver.slug}`)
                          .then(() => showToast('Lien copié dans le presse-papiers !', 'success'));
                      }}
                    >
                      <Copy size={13} strokeWidth={1.5} /> Copier
                    </button>
                    <a
                      href={`/book/${driver.slug}`} target="_blank" rel="noopener noreferrer"
                      className="btn btn-sm btn-dark"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                    >
                      <ExternalLink size={13} strokeWidth={1.5} /> Ouvrir
                    </a>
                  </div>
                </div>
              </div>
            )}

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
