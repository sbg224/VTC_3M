import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, TrendingUp, Calculator, Home,
  Settings, LogOut, CheckCircle, XCircle,
  Search, MessageSquare, FileText, Receipt, AlertTriangle,
  Calendar,
  CreditCard, Zap, Shield, ExternalLink,
  Users, BarChart3, Ban, UserCheck, Copy, Link,
  Users2, Download, Phone, Mail, Star, ArrowUp, ArrowDown, Minus, MoreHorizontal,
} from 'lucide-react';
import { useAuth } from '../services/auth';
import { reservationAPI, statsAPI, adminAPI, reviewAPI } from '../services/api';
import CompleteModal from './dashboard-views/CompleteModal';
import ReservationDetail from './dashboard-views/ReservationDetail';
import CrmView from './dashboard-views/CrmView';
import AdminView from './dashboard-views/AdminView';
import SubscriptionView from './dashboard-views/SubscriptionView';
import PrixCalculateur from './dashboard-views/PrixCalculateur';
import ChangePasswordForm from './dashboard-views/ChangePasswordForm';
import StatisticsView from './dashboard-views/StatisticsView';
import ReviewsView from './dashboard-views/ReviewsView';
import PlanningView from './dashboard-views/PlanningView';
import ReservationsView from './dashboard-views/ReservationsView';
import HomeView from './dashboard-views/HomeView';

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
          <HomeView
            driver={driver}
            stats={stats}
            onNavigate={setView}
            onSelectReservation={setSelectedReservation}
          />
        )}

        {/* ── VUE RÉSERVATIONS ── */}
        {view === 'reservations' && (
          <ReservationsView
            reservations={reservations}
            total={total}
            page={page}
            pages={pages}
            statusFilter={statusFilter}
            search={search}
            loadingData={loadingData}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            onStatusFilterChange={(v) => { setStatusFilter(v); setPage(1); }}
            onPage={setPage}
            onSelectReservation={setSelectedReservation}
            onCompleteReservation={setCompleteReservation}
          />
        )}

        {/* ── VUE PLANNING HEBDOMADAIRE ── */}
        {view === 'planning' && (
          <PlanningView
            planningWeekOffset={planningWeekOffset}
            planningRides={planningRides}
            planningLoading={planningLoading}
            getWeekDates={getWeekDates}
            onWeekChange={setPlanningWeekOffset}
          />
        )}

        {/* ── VUE AVIS CLIENTS ── */}
        {view === 'avis' && <ReviewsView reviews={reviews} reviewsMeta={reviewsMeta} reviewsLoading={reviewsLoading} />}

        {/* ── VUE STATISTIQUES ── */}
        {view === 'stats' && <StatisticsView stats={stats} />}

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
