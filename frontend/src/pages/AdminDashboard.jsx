import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, ClipboardList, UserCheck, UserX, Bell,
  LogOut, Search, ChevronDown, ChevronUp, RefreshCw, Send,
  CheckCircle, XCircle, Clock, Flag, Ban, Eye, Mail, Phone,
  Euro, Car, TrendingUp, AlertTriangle, Loader2, X,
  Shield, Activity, BarChart3, MessageSquare, Filter,
  ChevronLeft, ChevronRight, Zap, ExternalLink, UserCog,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../services/auth';
import { adminAPI } from '../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(n ?? 0);
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—';

const STATUS_DRIVER = {
  pending:   { label: 'En attente',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  Icon: Clock },
  trial:     { label: 'Essai',       color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  Icon: Zap },
  active:    { label: 'Actif',       color: '#10b981', bg: 'rgba(16,185,129,0.12)',  Icon: CheckCircle },
  suspended: { label: 'Suspendu',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   Icon: Ban },
  expired:   { label: 'Expiré',      color: '#6b7280', bg: 'rgba(107,114,128,0.12)', Icon: XCircle },
};

const STATUS_RES = {
  pending:   { label: 'En attente',  cls: 'badge-pending' },
  confirmed: { label: 'Confirmée',   cls: 'badge-confirmed' },
  completed: { label: 'Terminée',    cls: 'badge-completed' },
  cancelled: { label: 'Annulée',     cls: 'badge-cancelled' },
};

function DriverBadge({ status }) {
  const s = STATUS_DRIVER[status] || STATUS_DRIVER.expired;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:9999, fontSize:'0.72rem', fontWeight:700, color: s.color, background: s.bg, border:`1px solid ${s.color}40` }}>
      <s.Icon size={11} strokeWidth={2} /> {s.label}
    </span>
  );
}

// ── Mini composant KPI ────────────────────────────────────────────────────────
function KpiCard({ icon, value, label, sub, color = '#D4AF37', onClick }) {
  return (
    <div className="adm-kpi" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="adm-kpi-icon" style={{ background: `${color}1a`, color }}>{icon}</div>
      <div>
        <div className="adm-kpi-value">{value}</div>
        <div className="adm-kpi-label">{label}</div>
        {sub && <div className="adm-kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}

// ── Modal détail chauffeur ────────────────────────────────────────────────────
function DriverModal({ driverId, onClose, onStatusChange }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notif, setNotif]   = useState({ subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent]     = useState('');

  useEffect(() => {
    adminAPI.getDriverDetail(driverId)
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [driverId]);

  const sendNotif = async () => {
    if (!notif.message.trim()) return;
    setSending(true);
    try {
      await adminAPI.notifyDriver(driverId, notif.subject, notif.message);
      setSent('Email envoyé avec succès.');
      setNotif({ subject: '', message: '' });
      setNotifOpen(false);
    } catch {
      setSent('Erreur lors de l\'envoi.');
    } finally {
      setSending(false);
    }
  };

  const changeStatus = async (status) => {
    try {
      await adminAPI.updateStatus(driverId, status);
      setData(prev => ({ ...prev, driver: { ...prev.driver, status } }));
      onStatusChange?.();
    } catch {}
  };

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <motion.div
        className="adm-modal"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.22 }}
      >
        <div className="adm-modal-header">
          <h3><UserCog size={17} strokeWidth={1.75} /> Fiche chauffeur</h3>
          <button className="adm-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><Loader2 size={28} className="animate-spin" style={{ color: '#D4AF37' }} /></div>
        ) : !data ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#ef4444' }}>Chauffeur introuvable.</div>
        ) : (
          <div className="adm-modal-body">
            {/* Identité */}
            <div className="adm-driver-identity">
              <div className="adm-driver-avatar">{data.driver.name?.charAt(0).toUpperCase()}</div>
              <div>
                <h4>{data.driver.name}</h4>
                <div className="adm-driver-meta">
                  <Mail size={13} /> {data.driver.email}
                  {data.driver.phone && <><Phone size={13} /> {data.driver.phone}</>}
                </div>
                {data.driver.businessName && <div className="adm-driver-business">{data.driver.businessName}</div>}
                <div style={{ marginTop: 8 }}><DriverBadge status={data.driver.status} /></div>
              </div>
            </div>

            {/* Stats */}
            <div className="adm-driver-stats">
              {[
                { label: 'Total courses',    value: data.stats.totalReservations, color: '#6366f1' },
                { label: 'Terminées',        value: data.stats.completedReservations, color: '#10b981' },
                { label: 'En attente',       value: data.stats.pendingReservations, color: '#f59e0b' },
                { label: 'Revenus',          value: `${fmt(data.stats.totalRevenue)} €`, color: '#D4AF37' },
              ].map((s, i) => (
                <div key={i} className="adm-driver-stat">
                  <span style={{ color: s.color, fontFamily:'var(--font-heading)', fontSize:'1.4rem', fontWeight:800 }}>{s.value}</span>
                  <span style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Infos compte */}
            <div className="adm-driver-info-grid">
              <div><span>Inscrit le</span><strong>{fmtDate(data.driver.createdAt)}</strong></div>
              <div><span>Plan</span><strong style={{ color:'#D4AF37', textTransform:'uppercase' }}>{data.driver.plan}</strong></div>
              <div><span>Fin d'essai</span><strong>{fmtDate(data.driver.trialEndDate)}</strong></div>
              <div><span>Slug</span><strong>/book/{data.driver.slug || '—'}</strong></div>
            </div>

            {/* Actions statut */}
            <div className="adm-driver-actions">
              <p style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.4)', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.5px' }}>Changer le statut</p>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {[
                  { s:'trial',     label:'Valider (essai)',  Icon:Zap,         color:'#6366f1' },
                  { s:'active',    label:'Activer',          Icon:CheckCircle, color:'#10b981' },
                  { s:'suspended', label:'Suspendre',        Icon:Ban,         color:'#ef4444' },
                  { s:'expired',   label:'Expirer',          Icon:XCircle,     color:'#6b7280' },
                ].filter(a => a.s !== data.driver.status).map(a => (
                  <button
                    key={a.s}
                    className="adm-status-btn"
                    style={{ '--c': a.color }}
                    onClick={() => changeStatus(a.s)}
                  >
                    <a.Icon size={13} strokeWidth={2} /> {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification */}
            <div className="adm-driver-notify">
              <button className="adm-notify-toggle" onClick={() => setNotifOpen(o => !o)}>
                <Bell size={14} strokeWidth={1.75} /> Envoyer un message
                {notifOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
                    exit={{ opacity:0, height:0 }} style={{ overflow:'hidden' }}
                  >
                    <div className="adm-notify-form">
                      <input
                        type="text" placeholder="Objet (facultatif)"
                        className="adm-input"
                        value={notif.subject}
                        onChange={e => setNotif(p => ({ ...p, subject: e.target.value }))}
                      />
                      <textarea
                        placeholder="Votre message…"
                        className="adm-input"
                        rows={4}
                        value={notif.message}
                        onChange={e => setNotif(p => ({ ...p, message: e.target.value }))}
                        style={{ resize:'vertical', minHeight:90 }}
                      />
                      <button className="adm-btn-primary" disabled={!notif.message.trim() || sending} onClick={sendNotif}>
                        {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} strokeWidth={2} />}
                        Envoyer
                      </button>
                      {sent && <div style={{ fontSize:'0.8rem', color: sent.includes('succès') ? '#10b981' : '#ef4444', marginTop:6 }}>{sent}</div>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Dernières réservations */}
            <div className="adm-driver-recent">
              <p style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>10 dernières courses</p>
              {data.recentReservations.length === 0
                ? <div style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.85rem' }}>Aucune course.</div>
                : data.recentReservations.map(r => (
                  <div key={r.id} className="adm-res-row">
                    <div>
                      <span className="adm-res-number">{r.reservationNumber}</span>
                      <span style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.45)' }}> · {fmtDate(r.date)}</span>
                    </div>
                    <div style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.55)', marginTop:2 }}>
                      {r.departureAddress?.slice(0, 35)}… → {r.arrivalAddress?.slice(0, 25)}…
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:4 }}>
                      <span className={`badge ${STATUS_RES[r.status]?.cls || 'badge-pending'}`}>{STATUS_RES[r.status]?.label || r.status}</span>
                      {r.price && <span style={{ color:'#D4AF37', fontSize:'0.82rem', fontWeight:700 }}>{fmt(r.price)} €</span>}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── DASHBOARD ADMIN PRINCIPAL ─────────────────────────────────────────────────
export default function AdminDashboard() {
  const { logout, driver: adminUser, token } = useAuth();
  const navigate = useNavigate();

  // Sécurité : si pas admin, rediriger immédiatement
  useEffect(() => {
    if (adminUser && adminUser.role !== 'admin') {
      navigate('/dashboard', { replace: true });
    }
  }, [adminUser, navigate]);

  const [section, setSection]   = useState('overview');
  const [stats, setStats]       = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Chauffeurs
  const [drivers, setDrivers]         = useState([]);
  const [driversTotal, setDriversTotal] = useState(0);
  const [driverPage, setDriverPage]   = useState(1);
  const [driverFilter, setDriverFilter] = useState('all');
  const [driverSearch, setDriverSearch] = useState('');
  const [driversLoading, setDriversLoading] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);

  // Réservations
  const [reservations, setReservations] = useState([]);
  const [resTotal, setResTotal]   = useState(0);
  const [resPage, setResPage]     = useState(1);
  const [resFilter, setResFilter] = useState('all');
  const [resSearch, setResSearch] = useState('');
  const [resLoading, setResLoading] = useState(false);

  // Clients
  const [clients, setClients]     = useState([]);
  const [clientsTotal, setClientsTotal] = useState(0);
  const [clientPage, setClientPage] = useState(1);
  const [clientSearch, setClientSearch] = useState('');
  const [clientsLoading, setClientsLoading] = useState(false);

  // Notification globale
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcast, setBroadcast] = useState({ subject:'', message:'' });
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState('');

  // ── Chargement stats globales ──────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data } = await adminAPI.getGlobalStats();
      setStats(data);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // ── Chargement chauffeurs ──────────────────────────────────────────────────
  const loadDrivers = useCallback(async () => {
    setDriversLoading(true);
    try {
      const { data } = await adminAPI.getDrivers({ page: driverPage, status: driverFilter, search: driverSearch, limit: 20 });
      setDrivers(data.drivers);
      setDriversTotal(data.total);
    } finally {
      setDriversLoading(false);
    }
  }, [driverPage, driverFilter, driverSearch]);

  // ── Chargement réservations ────────────────────────────────────────────────
  const loadReservations = useCallback(async () => {
    setResLoading(true);
    try {
      const { data } = await adminAPI.getAllReservations({ page: resPage, status: resFilter, search: resSearch, limit: 25 });
      setReservations(data.reservations);
      setResTotal(data.total);
    } finally {
      setResLoading(false);
    }
  }, [resPage, resFilter, resSearch]);

  // ── Chargement clients ─────────────────────────────────────────────────────
  const loadClients = useCallback(async () => {
    setClientsLoading(true);
    try {
      const { data } = await adminAPI.getGlobalClients({ page: clientPage, search: clientSearch, limit: 25 });
      setClients(data.clients);
      setClientsTotal(data.total);
    } finally {
      setClientsLoading(false);
    }
  }, [clientPage, clientSearch]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { if (section === 'drivers' || section === 'inscriptions') loadDrivers(); }, [section, loadDrivers]);
  useEffect(() => { if (section === 'reservations') loadReservations(); }, [section, loadReservations]);
  useEffect(() => { if (section === 'clients') loadClients(); }, [section, loadClients]);

  // ── Notification broadcast (tous chauffeurs actifs) ────────────────────────
  const sendBroadcast = async () => {
    if (!broadcast.message.trim()) return;
    setBroadcastSending(true);
    try {
      const { data } = await adminAPI.getDrivers({ status: 'active', limit: 100 });
      const active = data.drivers;
      await Promise.allSettled(
        active.map(d => adminAPI.notifyDriver(d.id, broadcast.subject, broadcast.message))
      );
      setBroadcastResult(`Message envoyé à ${active.length} chauffeur(s) actif(s).`);
      setBroadcast({ subject:'', message:'' });
    } catch {
      setBroadcastResult('Erreur lors de l\'envoi.');
    } finally {
      setBroadcastSending(false);
    }
  };

  // ── Navigation sidebar ─────────────────────────────────────────────────────
  const navItems = [
    { id: 'overview',      label: 'Vue d\'ensemble',    Icon: LayoutDashboard },
    { id: 'inscriptions',  label: 'Inscriptions',        Icon: UserCheck, badge: stats?.drivers?.byStatus?.pending },
    { id: 'drivers',       label: 'CRM Chauffeurs',      Icon: Users },
    { id: 'reservations',  label: 'Courses globales',    Icon: ClipboardList },
    { id: 'clients',       label: 'CRM Clients',         Icon: MessageSquare },
    { id: 'notifications', label: 'Notifications',       Icon: Bell },
  ];

  const pendingCount = stats?.drivers?.byStatus?.pending ?? 0;

  return (
    <div className="adm-layout">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="adm-sidebar">
        <div className="adm-sidebar-brand">
          <img src="/images/logo-3m-new.svg" alt="3M Drive" style={{ width:32, height:32, objectFit:'contain' }} />
          <div>
            <div className="adm-brand-name">3M Drive</div>
            <div className="adm-brand-role">Administration</div>
          </div>
        </div>

        <nav className="adm-nav">
          {navItems.map(({ id, label, Icon, badge }) => (
            <button
              key={id}
              className={`adm-nav-item ${section === id ? 'active' : ''}`}
              onClick={() => setSection(id)}
            >
              <Icon size={17} strokeWidth={1.75} />
              <span>{label}</span>
              {badge > 0 && <span className="adm-badge">{badge}</span>}
            </button>
          ))}
        </nav>

        <div className="adm-sidebar-footer">
          <div className="adm-admin-info">
            <Shield size={14} strokeWidth={1.75} style={{ color:'#6366f1' }} />
            <span>{adminUser?.name || 'Admin'}</span>
          </div>
          <button className="adm-logout" onClick={() => { logout(); navigate('/login'); }}>
            <LogOut size={15} strokeWidth={1.75} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Contenu principal ────────────────────────────────────────────────── */}
      <main className="adm-main">

        {/* ══ VUE D'ENSEMBLE ════════════════════════════════════════════════════ */}
        {section === 'overview' && (
          <div className="adm-section">
            <div className="adm-section-header">
              <h1>Vue d'ensemble</h1>
              <button className="adm-btn-icon" onClick={loadStats} title="Rafraîchir">
                <RefreshCw size={16} strokeWidth={1.75} />
              </button>
            </div>

            {statsLoading ? (
              <div className="adm-loader"><Loader2 size={28} className="animate-spin" /></div>
            ) : stats ? (
              <>
                {/* KPIs chauffeurs */}
                <div className="adm-kpi-section-title">Chauffeurs</div>
                <div className="adm-kpi-grid">
                  <KpiCard icon={<Users size={20} strokeWidth={1.5} />} value={stats.drivers.total} label="Total inscrits" color="#6366f1" onClick={() => setSection('drivers')} />
                  <KpiCard icon={<Clock size={20} strokeWidth={1.5} />} value={stats.drivers.byStatus.pending} label="En attente validation" color="#f59e0b" sub="Nécessite action" onClick={() => setSection('inscriptions')} />
                  <KpiCard icon={<Zap size={20} strokeWidth={1.5} />} value={stats.drivers.byStatus.trial} label="En essai" color="#6366f1" />
                  <KpiCard icon={<CheckCircle size={20} strokeWidth={1.5} />} value={stats.drivers.byStatus.active} label="Actifs" color="#10b981" />
                  <KpiCard icon={<Ban size={20} strokeWidth={1.5} />} value={stats.drivers.byStatus.suspended} label="Suspendus" color="#ef4444" />
                </div>

                {/* KPIs courses */}
                <div className="adm-kpi-section-title" style={{ marginTop:28 }}>Courses & Revenus</div>
                <div className="adm-kpi-grid">
                  <KpiCard icon={<ClipboardList size={20} strokeWidth={1.5} />} value={stats.reservations.total} label="Total réservations" color="#D4AF37" onClick={() => setSection('reservations')} />
                  <KpiCard icon={<Flag size={20} strokeWidth={1.5} />} value={stats.reservations.completed} label="Courses terminées" color="#10b981" />
                  <KpiCard icon={<Clock size={20} strokeWidth={1.5} />} value={stats.reservations.pending} label="En attente" color="#f59e0b" />
                  <KpiCard icon={<Euro size={20} strokeWidth={1.5} />} value={`${fmt(stats.revenue.total)} €`} label="Revenus totaux" color="#D4AF37" />
                  <KpiCard icon={<TrendingUp size={20} strokeWidth={1.5} />} value={`${fmt(stats.revenue.month)} €`} label="Ce mois-ci" color="#6366f1" />
                </div>

                {/* Alerte inscriptions en attente */}
                {pendingCount > 0 && (
                  <motion.div className="adm-alert" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
                    <AlertTriangle size={16} strokeWidth={2} />
                    <span><strong>{pendingCount} inscription(s)</strong> en attente de validation.</span>
                    <button className="adm-alert-btn" onClick={() => setSection('inscriptions')}>
                      Voir <ChevronRight size={14} />
                    </button>
                  </motion.div>
                )}
              </>
            ) : (
              <div className="adm-empty">Impossible de charger les statistiques.</div>
            )}
          </div>
        )}

        {/* ══ INSCRIPTIONS ══════════════════════════════════════════════════════ */}
        {section === 'inscriptions' && (
          <div className="adm-section">
            <div className="adm-section-header">
              <h1>Inscriptions en attente</h1>
              <button className="adm-btn-icon" onClick={loadDrivers}><RefreshCw size={16} strokeWidth={1.75} /></button>
            </div>
            <p className="adm-section-desc">Validez ou rejetez les nouveaux chauffeurs qui souhaitent rejoindre la plateforme.</p>

            {driversLoading ? (
              <div className="adm-loader"><Loader2 size={28} className="animate-spin" /></div>
            ) : (
              <>
                {drivers.filter(d => d.status === 'pending').length === 0 ? (
                  <div className="adm-empty">
                    <CheckCircle size={36} strokeWidth={1} style={{ color:'#10b981', marginBottom:12 }} />
                    <p>Aucune inscription en attente. Tout est traité.</p>
                  </div>
                ) : (
                  <div className="adm-inscriptions-list">
                    {drivers.filter(d => d.status === 'pending').map(d => (
                      <div key={d.id} className="adm-inscription-card">
                        <div className="adm-inscription-left">
                          <div className="adm-avatar">{d.name?.charAt(0).toUpperCase()}</div>
                          <div>
                            <div className="adm-inscription-name">{d.name}</div>
                            <div className="adm-inscription-meta"><Mail size={12} /> {d.email}</div>
                            {d.phone && <div className="adm-inscription-meta"><Phone size={12} /> {d.phone}</div>}
                            {d.businessName && <div className="adm-inscription-meta" style={{ color:'#D4AF37' }}>{d.businessName}</div>}
                            <div className="adm-inscription-date">Inscrit le {fmtDate(d.createdAt)}</div>
                          </div>
                        </div>
                        <div className="adm-inscription-actions">
                          <button
                            className="adm-btn-success"
                            onClick={async () => { await adminAPI.updateStatus(d.id, 'trial'); loadDrivers(); loadStats(); }}
                          >
                            <CheckCircle size={14} strokeWidth={2} /> Valider (essai 14j)
                          </button>
                          <button
                            className="adm-btn-danger"
                            onClick={async () => { await adminAPI.updateStatus(d.id, 'suspended'); loadDrivers(); loadStats(); }}
                          >
                            <XCircle size={14} strokeWidth={2} /> Rejeter
                          </button>
                          <button className="adm-btn-ghost" onClick={() => setSelectedDriver(d.id)}>
                            <Eye size={14} strokeWidth={1.75} /> Détail
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══ CRM CHAUFFEURS ════════════════════════════════════════════════════ */}
        {section === 'drivers' && (
          <div className="adm-section">
            <div className="adm-section-header">
              <h1>CRM Chauffeurs</h1>
              <button className="adm-btn-icon" onClick={loadDrivers}><RefreshCw size={16} strokeWidth={1.75} /></button>
            </div>

            {/* Filtres */}
            <div className="adm-filters">
              <div className="adm-search-wrap">
                <Search size={15} strokeWidth={1.75} />
                <input
                  type="text" className="adm-search" placeholder="Rechercher par nom ou email…"
                  value={driverSearch}
                  onChange={e => { setDriverSearch(e.target.value); setDriverPage(1); }}
                />
              </div>
              <div className="adm-filter-tabs">
                {['all','pending','trial','active','suspended','expired'].map(s => (
                  <button
                    key={s}
                    className={`adm-filter-tab ${driverFilter === s ? 'active' : ''}`}
                    onClick={() => { setDriverFilter(s); setDriverPage(1); }}
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
                          <td><span style={{ color:'#D4AF37', fontWeight:700, textTransform:'uppercase', fontSize:'0.78rem' }}>{d.plan}</span></td>
                          <td style={{ color:'rgba(255,255,255,0.75)' }}>{d.reservationCount}</td>
                          <td style={{ color:'#D4AF37', fontWeight:700 }}>{fmt(d.totalRevenue)} €</td>
                          <td style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.8rem' }}>{fmtDate(d.createdAt)}</td>
                          <td>
                            <button className="adm-btn-icon-sm" onClick={() => setSelectedDriver(d.id)} title="Voir la fiche">
                              <Eye size={14} strokeWidth={1.75} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={driverPage} total={driversTotal} perPage={20} onPage={setDriverPage} />
              </>
            )}
          </div>
        )}

        {/* ══ COURSES GLOBALES ══════════════════════════════════════════════════ */}
        {section === 'reservations' && (
          <div className="adm-section">
            <div className="adm-section-header">
              <h1>Courses globales</h1>
              <div style={{ display:'flex', gap:8 }}>
                <span style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.82rem', alignSelf:'center' }}>{resTotal} résultats</span>
                <button className="adm-btn-icon" onClick={loadReservations}><RefreshCw size={16} strokeWidth={1.75} /></button>
              </div>
            </div>

            <div className="adm-filters">
              <div className="adm-search-wrap">
                <Search size={15} strokeWidth={1.75} />
                <input type="text" className="adm-search" placeholder="N° réservation, nom, email…"
                  value={resSearch} onChange={e => { setResSearch(e.target.value); setResPage(1); }} />
              </div>
              <div className="adm-filter-tabs">
                {['all','pending','confirmed','completed','cancelled'].map(s => (
                  <button key={s} className={`adm-filter-tab ${resFilter === s ? 'active' : ''}`}
                    onClick={() => { setResFilter(s); setResPage(1); }}>
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
                          <td style={{ color:'#D4AF37', fontWeight:700, fontSize:'0.82rem', whiteSpace:'nowrap' }}>{r.reservationNumber}</td>
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
                          <td style={{ color:'#D4AF37', fontWeight:700, whiteSpace:'nowrap' }}>
                            {r.price ? `${fmt(r.price)} €` : r.estimatedPrice ? `~${fmt(r.estimatedPrice)} €` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={resPage} total={resTotal} perPage={25} onPage={setResPage} />
              </>
            )}
          </div>
        )}

        {/* ══ CRM CLIENTS ═══════════════════════════════════════════════════════ */}
        {section === 'clients' && (
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
                  value={clientSearch} onChange={e => { setClientSearch(e.target.value); setClientPage(1); }} />
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
                          <td style={{ color:'#D4AF37', fontWeight:700 }}>{c.totalSpent ? `${fmt(c.totalSpent)} €` : '—'}</td>
                          <td style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.8rem' }}>{fmtDateTime(c.lastReservation)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={clientPage} total={clientsTotal} perPage={25} onPage={setClientPage} />
              </>
            )}
          </div>
        )}

        {/* ══ NOTIFICATIONS ═════════════════════════════════════════════════════ */}
        {section === 'notifications' && (
          <div className="adm-section">
            <div className="adm-section-header"><h1>Notifications</h1></div>
            <p className="adm-section-desc">Envoyez un message ciblé à un ou tous vos chauffeurs actifs.</p>

            <div className="adm-notif-cards">
              {/* Broadcast tous chauffeurs */}
              <div className="adm-notif-card">
                <div className="adm-notif-card-header">
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:'rgba(99,102,241,0.15)', display:'flex', alignItems:'center', justifyContent:'center', color:'#6366f1' }}>
                      <Users size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                      <div style={{ fontWeight:700, color:'#fff', fontSize:'0.97rem' }}>Tous les chauffeurs actifs</div>
                      <div style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.4)' }}>Diffusion générale</div>
                    </div>
                  </div>
                </div>
                <div className="adm-notif-form">
                  <input type="text" className="adm-input" placeholder="Objet (facultatif)"
                    value={broadcast.subject} onChange={e => setBroadcast(p => ({ ...p, subject: e.target.value }))} />
                  <textarea className="adm-input" rows={5} placeholder="Rédigez votre message…"
                    style={{ resize:'vertical', minHeight:100 }}
                    value={broadcast.message} onChange={e => setBroadcast(p => ({ ...p, message: e.target.value }))} />
                  <button className="adm-btn-primary" disabled={!broadcast.message.trim() || broadcastSending} onClick={sendBroadcast}>
                    {broadcastSending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} strokeWidth={2} />}
                    Envoyer à tous les chauffeurs actifs
                  </button>
                  {broadcastResult && (
                    <div style={{ fontSize:'0.82rem', marginTop:8, color: broadcastResult.includes('Erreur') ? '#ef4444' : '#10b981' }}>
                      {broadcastResult}
                    </div>
                  )}
                </div>
              </div>

              {/* Chauffeur individuel */}
              <div className="adm-notif-card">
                <div className="adm-notif-card-header">
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:'rgba(212,175,55,0.1)', display:'flex', alignItems:'center', justifyContent:'center', color:'#D4AF37' }}>
                      <UserCog size={20} strokeWidth={1.5} />
                    </div>
                    <div>
                      <div style={{ fontWeight:700, color:'#fff', fontSize:'0.97rem' }}>Chauffeur individuel</div>
                      <div style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.4)' }}>Cliquez sur un chauffeur dans le CRM pour lui envoyer un message</div>
                    </div>
                  </div>
                </div>
                <button className="adm-btn-ghost-full" onClick={() => setSection('drivers')}>
                  <Users size={15} strokeWidth={1.75} /> Aller au CRM Chauffeurs <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ── Modal détail chauffeur ───────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedDriver && (
          <DriverModal
            driverId={selectedDriver}
            onClose={() => setSelectedDriver(null)}
            onStatusChange={() => { loadDrivers(); loadStats(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────────
function Pagination({ page, total, perPage, onPage }) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;
  return (
    <div className="adm-pagination">
      <button className="adm-page-btn" disabled={page === 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft size={15} />
      </button>
      <span style={{ fontSize:'0.82rem', color:'rgba(255,255,255,0.5)' }}>Page {page} / {pages} · {total} résultats</span>
      <button className="adm-page-btn" disabled={page === pages} onClick={() => onPage(page + 1)}>
        <ChevronRight size={15} />
      </button>
    </div>
  );
}
