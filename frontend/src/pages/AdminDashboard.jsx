import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, ClipboardList, UserCheck, UserX, Bell,
  LogOut, Search, ChevronDown, ChevronUp, RefreshCw, Send, MoreHorizontal, Home,
  CheckCircle, XCircle, Clock, Flag, Ban, Eye, Mail, Phone,
  Euro, Car, TrendingUp, AlertTriangle, Loader2, X,
  Activity, BarChart3, MessageSquare, Filter,
  ChevronLeft, ChevronRight, Zap, ExternalLink, UserCog, SlidersHorizontal, Save,
  Calculator, FileText, Download, Percent, Wallet, ReceiptText, CalendarDays, Edit3, Check,
  IdCard, Copy, Plus, Trash2, Pencil, ToggleLeft, ToggleRight, Upload,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../services/auth';
import { adminAPI, accountingAPI, contactAdminAPI, downloadBlob } from '../services/api';
import { fmt, fmtDate, fmtDateTime, STATUS_DRIVER, STATUS_RES } from './admin-dashboard/adminHelpers';
import DriverBadge from './admin-dashboard/DriverBadge';
import KpiCard from './admin-dashboard/KpiCard';
import DriverModal from './admin-dashboard/DriverModal';
import ContactModal from './admin-dashboard/ContactModal';
import Pagination from './admin-dashboard/Pagination';

export default function AdminDashboard() {
  const { logout, driver: adminUser } = useAuth();
  const navigate = useNavigate();

  // Sécurité : si pas admin, rediriger immédiatement
  useEffect(() => {
    if (adminUser && adminUser.role !== 'admin') {
      navigate('/dashboard', { replace: true });
    }
  }, [adminUser, navigate]);

  const [section, setSection]   = useState('overview');
  const [moreOpen, setMoreOpen] = useState(false);
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

  // Tarification
  const [pricing, setPricing]           = useState(null);
  const [pricingForm, setPricingForm]   = useState({ pricePerKm: '', minimumPrice: '', baseFee: '' });
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingSaving, setPricingSaving]   = useState(false);
  const [pricingMsg, setPricingMsg]     = useState({ text: '', ok: true });

  // Comptabilité
  const [accPeriod, setAccPeriod]               = useState('month');
  const [accStart, setAccStart]                 = useState('');
  const [accEnd, setAccEnd]                     = useState('');
  const [accSummary, setAccSummary]             = useState(null);
  const [accTotals, setAccTotals]               = useState(null);
  const [accPeriodLabel, setAccPeriodLabel]     = useState('');
  const [accLoading, setAccLoading]             = useState(false);
  const [accDetail, setAccDetail]               = useState(null);  // détail d'un chauffeur
  const [accDetailLoading, setAccDetailLoading] = useState(false);
  const [accPdfLoading, setAccPdfLoading]       = useState({});    // { driverId: bool }
  const [accEditComm, setAccEditComm]           = useState({});    // { driverId: string } — édition inline
  const [accCommSaving, setAccCommSaving]       = useState({});    // { driverId: bool }

  // Cartes de visite (module Contact)
  const [contactsList,   setContactsList]   = useState([]);
  const [contactsTotal,  setContactsTotal]  = useState(0);
  const [contactPage,    setContactPage]    = useState(1);
  const [contactSearch,  setContactSearch]  = useState('');
  const [contactsLoading, setContactsLoading] = useState(false);
  const [openContactId,  setOpenContactId]  = useState(null); // null | 'new' | id

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
    } catch (err) {
      if (import.meta.env.DEV) console.error('[Stats]', err);
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
    } catch (err) {
      if (import.meta.env.DEV) console.error('[Drivers]', err);
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
    } catch (err) {
      if (import.meta.env.DEV) console.error('[Reservations]', err);
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
    } catch (err) {
      if (import.meta.env.DEV) console.error('[Clients]', err);
    } finally {
      setClientsLoading(false);
    }
  }, [clientPage, clientSearch]);

  // ── Chargement cartes de visite (module Contact) ───────────────────────────
  const loadContacts = useCallback(async () => {
    setContactsLoading(true);
    try {
      const { data } = await contactAdminAPI.getAll({ page: contactPage, search: contactSearch, limit: 20 });
      setContactsList(data.contacts);
      setContactsTotal(data.total);
    } catch (err) {
      if (import.meta.env.DEV) console.error('[Contacts]', err);
    } finally {
      setContactsLoading(false);
    }
  }, [contactPage, contactSearch]);

  const deleteContact = async (id) => {
    if (!window.confirm('Supprimer définitivement cette carte de visite ?')) return;
    try {
      await contactAdminAPI.remove(id);
      loadContacts();
    } catch {
      // best-effort — l'utilisateur verra la ligne toujours présente si échec
    }
  };

  const toggleContactPublic = async (contact) => {
    try {
      await contactAdminAPI.update(contact.id, { isPublic: !contact.isPublic });
      loadContacts();
    } catch {
      // best-effort
    }
  };

  // ── Chargement tarification ────────────────────────────────────────────────
  const loadPricing = useCallback(async () => {
    setPricingLoading(true);
    try {
      const { data } = await adminAPI.getPricing();
      setPricing(data);
      setPricingForm({
        pricePerKm:   String(data.pricePerKm),
        minimumPrice: String(data.minimumPrice),
        baseFee:      String(data.baseFee),
      });
    } catch (err) {
      if (import.meta.env.DEV) console.error('[Pricing]', err);
    } finally {
      setPricingLoading(false);
    }
  }, []);

  const savePricing = async () => {
    setPricingSaving(true);
    setPricingMsg({ text: '', ok: true });
    try {
      await adminAPI.updatePricing({
        pricePerKm:   parseFloat(pricingForm.pricePerKm),
        minimumPrice: parseFloat(pricingForm.minimumPrice),
        baseFee:      parseFloat(pricingForm.baseFee),
      });
      setPricingMsg({ text: 'Tarification mise à jour avec succès.', ok: true });
      loadPricing();
    } catch (err) {
      setPricingMsg({ text: err.response?.data?.error || 'Erreur lors de la sauvegarde.', ok: false });
    } finally {
      setPricingSaving(false);
    }
  };

  // ── Comptabilité ───────────────────────────────────────────────────────────
  const loadAccounting = useCallback(async (period, start, end) => {
    setAccLoading(true);
    setAccDetail(null);
    try {
      const params = { period: period || accPeriod };
      if ((period || accPeriod) === 'custom') { params.startDate = start || accStart; params.endDate = end || accEnd; }
      const { data } = await accountingAPI.getSummary(params);
      setAccSummary(data.summary);
      setAccTotals(data.totals);
      setAccPeriodLabel(data.period.label);
    } catch (err) {
      if (import.meta.env.DEV) console.error('[Accounting]', err);
    } finally {
      setAccLoading(false);
    }
  }, [accPeriod, accStart, accEnd]);

  const loadAccDetail = async (driverId) => {
    setAccDetailLoading(true);
    try {
      const params = { period: accPeriod };
      if (accPeriod === 'custom') { params.startDate = accStart; params.endDate = accEnd; }
      const { data } = await accountingAPI.getDriverStatement(driverId, params);
      setAccDetail(data);
    } finally {
      setAccDetailLoading(false);
    }
  };

  const downloadStatementPdf = async (driverId) => {
    setAccPdfLoading(p => ({ ...p, [driverId]: true }));
    try {
      const params = { period: accPeriod };
      if (accPeriod === 'custom') { params.startDate = accStart; params.endDate = accEnd; }
      const { data } = await accountingAPI.downloadPdf(driverId, params);
      downloadBlob(data, `bordereau-${driverId}.pdf`);
    } catch (err) {
      if (import.meta.env.DEV) console.error('[PDF]', err);
    } finally {
      setAccPdfLoading(p => ({ ...p, [driverId]: false }));
    }
  };

  const saveCommission = async (driverId, rate) => {
    setAccCommSaving(p => ({ ...p, [driverId]: true }));
    try {
      await accountingAPI.updateCommission(driverId, parseFloat(rate));
      setAccEditComm(p => { const n = { ...p }; delete n[driverId]; return n; });
      loadAccounting();
    } catch (err) {
      if (import.meta.env.DEV) console.error('[Commission]', err);
    } finally {
      setAccCommSaving(p => ({ ...p, [driverId]: false }));
    }
  };

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { if (section === 'drivers' || section === 'inscriptions') loadDrivers(); }, [section, loadDrivers]);
  useEffect(() => { if (section === 'reservations') loadReservations(); }, [section, loadReservations]);
  useEffect(() => { if (section === 'clients') loadClients(); }, [section, loadClients]);
  useEffect(() => { if (section === 'contacts') loadContacts(); }, [section, loadContacts]);
  useEffect(() => { if (section === 'pricing') loadPricing(); }, [section, loadPricing]);
  useEffect(() => { if (section === 'accounting') loadAccounting(); }, [section]); // eslint-disable-line

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

  // ── Navigation ───────────────────────────────────────────────────────────
  const primaryNavItems = [
    { id: 'overview',      label: 'Vue d\'ensemble',    Icon: LayoutDashboard },
    { id: 'inscriptions',  label: 'Inscriptions',        Icon: UserCheck, badge: stats?.drivers?.byStatus?.pending },
    { id: 'drivers',       label: 'CRM Chauffeurs',      Icon: Users },
    { id: 'reservations',  label: 'Courses globales',    Icon: ClipboardList },
  ];
  const moreNavItems = [
    { id: 'clients',       label: 'CRM Clients',         Icon: MessageSquare },
    { id: 'contacts',      label: 'Cartes de visite',    Icon: IdCard },
    { id: 'notifications', label: 'Notifications',       Icon: Bell },
    { id: 'pricing',       label: 'Tarification',        Icon: SlidersHorizontal },
    { id: 'accounting',    label: 'Comptabilité',        Icon: Calculator },
  ];

  const pendingCount = stats?.drivers?.byStatus?.pending ?? 0;

  return (
    <div className="adm-layout">
      {/* ── Navigation flottante ──────────────────────────────────────────────── */}
      {moreOpen && <div className="bottom-nav-backdrop" onClick={() => setMoreOpen(false)} />}
      <nav className="bottom-nav" aria-label="Navigation de l'administration">
        {primaryNavItems.map(({ id, label, Icon, badge }) => (
          <button
            key={id}
            className={`bottom-nav-item ${section === id ? 'active' : ''}`}
            onClick={() => { setSection(id); setMoreOpen(false); }}
          >
            <Icon size={18} strokeWidth={1.75} />
            <span className="bottom-nav-label">{label}</span>
            {badge > 0 && <span className="bottom-nav-badge">{badge > 9 ? '9+' : badge}</span>}
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
          </button>

          {moreOpen && (
            <div className="bottom-nav-more-panel">
              <button
                onClick={() => { navigate('/'); setMoreOpen(false); }}
                title="Retour à l'accueil"
                aria-label="Retour à l'accueil"
                style={{ display:'flex', alignItems:'center', padding:'8px 12px 12px' }}
              >
                <img src="/images/nav-logo-dark.webp" alt="3M Drive" className="adm-brand-logo" />
              </button>
              <div className="bottom-nav-more-divider" />
              {moreNavItems.map(({ id, label, Icon, badge }) => (
                <button
                  key={id}
                  className={`bottom-nav-more-item ${section === id ? 'active' : ''}`}
                  onClick={() => { setSection(id); setMoreOpen(false); }}
                >
                  <Icon size={16} strokeWidth={1.5} />
                  {label}
                  {badge > 0 && <span className="bottom-nav-more-badge">{badge > 9 ? '9+' : badge}</span>}
                </button>
              ))}
              <div className="bottom-nav-more-divider" />
              <button className="bottom-nav-more-item" onClick={() => { navigate('/'); setMoreOpen(false); }}>
                <Home size={16} strokeWidth={1.5} />
                Retour à l'accueil
              </button>
              <div className="bottom-nav-more-driver">
                Connecté en tant que <strong>{adminUser?.name || 'Admin'}</strong>
              </div>
              <button className="bottom-nav-more-item logout" onClick={() => { logout(); navigate('/login'); }}>
                <LogOut size={16} strokeWidth={1.5} />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </nav>

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
                  <KpiCard icon={<ClipboardList size={20} strokeWidth={1.5} />} value={stats.reservations.total} label="Total réservations" color="#267253" onClick={() => setSection('reservations')} />
                  <KpiCard icon={<Flag size={20} strokeWidth={1.5} />} value={stats.reservations.completed} label="Courses terminées" color="#10b981" />
                  <KpiCard icon={<Clock size={20} strokeWidth={1.5} />} value={stats.reservations.pending} label="En attente" color="#f59e0b" />
                  <KpiCard icon={<Euro size={20} strokeWidth={1.5} />} value={`${fmt(stats.revenue.total)} €`} label="Revenus totaux" color="#267253" />
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
                            {d.businessName && <div className="adm-inscription-meta" style={{ color:'#267253' }}>{d.businessName}</div>}
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
                          <td><span style={{ color:'#267253', fontWeight:700, textTransform:'uppercase', fontSize:'0.78rem' }}>{d.plan}</span></td>
                          <td style={{ color:'rgba(255,255,255,0.75)' }}>{d.reservationCount}</td>
                          <td style={{ color:'#267253', fontWeight:700 }}>{fmt(d.totalRevenue)} €</td>
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
                          <td style={{ color:'#267253', fontWeight:700 }}>{c.totalSpent ? `${fmt(c.totalSpent)} €` : '—'}</td>
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

        {/* ══ CARTES DE VISITE (module Contact) ═════════════════════════════════ */}
        {section === 'contacts' && (
          <div className="adm-section">
            <div className="adm-section-header">
              <h1>Cartes de visite</h1>
              <button className="adm-btn-primary" onClick={() => setOpenContactId('new')}>
                <Plus size={15} strokeWidth={2} /> Nouvelle carte
              </button>
            </div>
            <p className="adm-section-desc">
              Carte de visite numérique publique (/contact/:slug) avec vCard et QR code — réutilisable pour
              n'importe quel collaborateur ou société, indépendamment des chauffeurs.
            </p>

            <div className="adm-filters">
              <div className="adm-search-wrap">
                <Search size={15} strokeWidth={1.75} />
                <input
                  type="text" className="adm-search" placeholder="Rechercher par nom ou société…"
                  value={contactSearch} onChange={(e) => { setContactSearch(e.target.value); setContactPage(1); }}
                />
              </div>
            </div>

            {contactsLoading ? (
              <div className="adm-loader"><Loader2 size={28} className="animate-spin" /></div>
            ) : (
              <>
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr><th>Contact</th><th>Société</th><th>Lien public</th><th>Statut</th><th></th></tr>
                    </thead>
                    <tbody>
                      {contactsList.length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.3)' }}>Aucune carte de visite.</td></tr>
                      ) : contactsList.map((c) => (
                        <tr key={c.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: '#fff' }}>{c.firstName} {c.lastName}</div>
                            {c.jobTitle && <div style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.38)' }}>{c.jobTitle}</div>}
                          </td>
                          <td style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem' }}>{c.company || '—'}</td>
                          <td style={{ fontSize: '0.8rem' }}>
                            <a href={`/contact/${c.slug}`} target="_blank" rel="noopener noreferrer" style={{ color: '#267253' }}>
                              /contact/{c.slug}
                            </a>
                          </td>
                          <td>
                            <button
                              className="adm-btn-icon" onClick={() => toggleContactPublic(c)}
                              title={c.isPublic ? 'Publique — cliquer pour dépublier' : 'Privée — cliquer pour publier'}
                              style={{ color: c.isPublic ? '#10b981' : 'rgba(255,255,255,0.35)' }}
                            >
                              {c.isPublic ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                            </button>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button className="adm-btn-icon" title="Modifier" onClick={() => setOpenContactId(c.id)}><Pencil size={14} /></button>
                              <button className="adm-btn-icon" title="Supprimer" style={{ color: '#ef4444' }} onClick={() => deleteContact(c.id)}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={contactPage} total={contactsTotal} perPage={20} onPage={setContactPage} />
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
                    <div style={{ width:40, height:40, borderRadius:12, background:'rgba(38,114,83,0.1)', display:'flex', alignItems:'center', justifyContent:'center', color:'#267253' }}>
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

        {/* ══ COMPTABILITÉ ══════════════════════════════════════════════════════ */}
        {section === 'accounting' && (
          <div className="adm-section">
            <div className="adm-section-header">
              <h1>Comptabilité</h1>
              <button className="adm-btn-icon" onClick={() => loadAccounting()} title="Rafraîchir">
                <RefreshCw size={16} strokeWidth={1.75} />
              </button>
            </div>
            <p className="adm-section-desc">
              Calculez le net à reverser à chaque chauffeur sur la période choisie, après déduction de la commission plateforme.
            </p>

            {/* ── Sélecteur de période ── */}
            <div className="adm-acc-period-bar">
              <div className="adm-filter-tabs">
                {[
                  { id: 'week',       label: 'Cette semaine' },
                  { id: 'month',      label: 'Ce mois' },
                  { id: 'prev_month', label: 'Mois précédent' },
                  { id: 'custom',     label: 'Personnalisé' },
                ].map(p => (
                  <button
                    key={p.id}
                    className={`adm-filter-tab ${accPeriod === p.id ? 'active' : ''}`}
                    onClick={() => { setAccPeriod(p.id); if (p.id !== 'custom') loadAccounting(p.id); }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {accPeriod === 'custom' && (
                <div className="adm-acc-custom-range">
                  <input type="date" className="adm-input" style={{ maxWidth:155, width:'100%', minWidth:130, marginBottom:0 }}
                    value={accStart} onChange={e => setAccStart(e.target.value)} />
                  <span style={{ color:'rgba(255,255,255,0.3)', padding:'0 4px' }}>→</span>
                  <input type="date" className="adm-input" style={{ maxWidth:155, width:'100%', minWidth:130, marginBottom:0 }}
                    value={accEnd} onChange={e => setAccEnd(e.target.value)} />
                  <button
                    className="adm-btn-primary" style={{ padding:'8px 18px' }}
                    disabled={!accStart || !accEnd}
                    onClick={() => loadAccounting('custom', accStart, accEnd)}
                  >
                    <CalendarDays size={14} /> Appliquer
                  </button>
                </div>
              )}
            </div>

            {accLoading ? (
              <div className="adm-loader"><Loader2 size={28} className="animate-spin" /></div>
            ) : accSummary ? (
              <>
                {/* Période affichée */}
                {accPeriodLabel && (
                  <div className="adm-acc-period-label">
                    <CalendarDays size={14} strokeWidth={1.75} /> {accPeriodLabel}
                  </div>
                )}

                {/* KPIs globaux */}
                {accTotals && (
                  <div className="adm-kpi-grid" style={{ marginBottom:28 }}>
                    <KpiCard icon={<ReceiptText size={20} strokeWidth={1.5} />} value={accTotals.rideCount} label="Courses terminées" color="#6366f1" />
                    <KpiCard icon={<Euro size={20} strokeWidth={1.5} />} value={`${fmt(accTotals.grossRevenue)} €`} label="CA brut total" color="#267253" />
                    <KpiCard icon={<Percent size={20} strokeWidth={1.5} />} value={`${fmt(accTotals.commissionAmount)} €`} label="Commissions plateforme" color="#f59e0b" />
                    <KpiCard icon={<Wallet size={20} strokeWidth={1.5} />} value={`${fmt(accTotals.netAmount)} €`} label="Net à reverser (total)" color="#10b981" />
                  </div>
                )}

                {/* Tableau des chauffeurs */}
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Chauffeur</th>
                        <th style={{ textAlign:'center' }}>Courses</th>
                        <th style={{ textAlign:'right' }}>CA brut</th>
                        <th style={{ textAlign:'center' }}>Commission</th>
                        <th style={{ textAlign:'right' }}>Commission €</th>
                        <th style={{ textAlign:'right', color:'#10b981' }}>Net à reverser</th>
                        <th style={{ textAlign:'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accSummary.length === 0 ? (
                        <tr><td colSpan={7} style={{ textAlign:'center', padding:32, color:'rgba(255,255,255,0.3)' }}>Aucun chauffeur.</td></tr>
                      ) : accSummary.map(d => (
                        <tr key={d.id} className={d.rideCount === 0 ? 'adm-acc-row-inactive' : ''}>
                          <td>
                            <div style={{ fontWeight:600, color:'#fff' }}>{d.name}</div>
                            <div style={{ fontSize:'0.76rem', color:'rgba(255,255,255,0.38)' }}>{d.email}</div>
                            {d.businessName && <div style={{ fontSize:'0.74rem', color:'#267253' }}>{d.businessName}</div>}
                          </td>
                          <td style={{ textAlign:'center', color: d.rideCount > 0 ? '#fff' : 'rgba(255,255,255,0.25)', fontWeight:700, fontSize:'1.05rem' }}>
                            {d.rideCount}
                          </td>
                          <td style={{ textAlign:'right', color:'#267253', fontWeight:700 }}>
                            {d.grossRevenue > 0 ? `${fmt(d.grossRevenue)} €` : <span style={{ color:'rgba(255,255,255,0.2)' }}>—</span>}
                          </td>
                          {/* Commission — édition inline */}
                          <td style={{ textAlign:'center' }}>
                            {accEditComm[d.id] !== undefined ? (
                              <div style={{ display:'flex', alignItems:'center', gap:4, justifyContent:'center' }}>
                                <input
                                  type="number" min="0" max="100" step="0.5"
                                  className="adm-input"
                                  style={{ width:72, marginBottom:0, padding:'5px 8px', textAlign:'center' }}
                                  value={accEditComm[d.id]}
                                  onChange={e => setAccEditComm(p => ({ ...p, [d.id]: e.target.value }))}
                                />
                                <span style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.8rem' }}>%</span>
                                <button
                                  className="adm-btn-icon-sm" style={{ color:'#10b981' }}
                                  disabled={accCommSaving[d.id]}
                                  onClick={() => saveCommission(d.id, accEditComm[d.id])}
                                  title="Enregistrer"
                                >
                                  {accCommSaving[d.id] ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} strokeWidth={2.5} />}
                                </button>
                                <button className="adm-btn-icon-sm" style={{ color:'rgba(255,255,255,0.3)' }}
                                  onClick={() => setAccEditComm(p => { const n = { ...p }; delete n[d.id]; return n; })}>
                                  <X size={13} />
                                </button>
                              </div>
                            ) : (
                              <div style={{ display:'flex', alignItems:'center', gap:4, justifyContent:'center' }}>
                                <span className="adm-acc-rate">{d.commissionRate}%</span>
                                <button
                                  className="adm-btn-icon-sm"
                                  title="Modifier le taux"
                                  onClick={() => setAccEditComm(p => ({ ...p, [d.id]: String(d.commissionRate) }))}
                                ><Edit3 size={12} strokeWidth={1.75} /></button>
                              </div>
                            )}
                          </td>
                          <td style={{ textAlign:'right', color:'#f59e0b', fontWeight:600 }}>
                            {d.commissionAmount > 0 ? `${fmt(d.commissionAmount)} €` : <span style={{ color:'rgba(255,255,255,0.2)' }}>—</span>}
                          </td>
                          <td style={{ textAlign:'right' }}>
                            <span style={{
                              color: d.netAmount > 0 ? '#10b981' : 'rgba(255,255,255,0.25)',
                              fontWeight: 800, fontSize:'1rem',
                            }}>
                              {d.netAmount > 0 ? `${fmt(d.netAmount)} €` : '—'}
                            </span>
                          </td>
                          <td style={{ textAlign:'center' }}>
                            <div style={{ display:'flex', gap:4, justifyContent:'center' }}>
                              <button
                                className="adm-btn-icon-sm" title="Voir le détail"
                                onClick={() => loadAccDetail(d.id)}
                              ><Eye size={14} strokeWidth={1.75} /></button>
                              <button
                                className="adm-btn-icon-sm" title="Télécharger le bordereau PDF"
                                disabled={accPdfLoading[d.id] || d.rideCount === 0}
                                style={{ color: d.rideCount > 0 ? '#267253' : 'rgba(255,255,255,0.2)', cursor: d.rideCount === 0 ? 'not-allowed' : 'pointer' }}
                                onClick={() => downloadStatementPdf(d.id)}
                              >
                                {accPdfLoading[d.id] ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} strokeWidth={1.75} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ── Détail chauffeur (inline panel) ── */}
                <AnimatePresence>
                  {(accDetail || accDetailLoading) && (
                    <motion.div
                      className="adm-acc-detail-panel"
                      initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                      exit={{ opacity:0, y:8 }} transition={{ duration:0.2 }}
                    >
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <FileText size={16} strokeWidth={1.75} style={{ color:'#267253' }} />
                          <strong style={{ color:'#fff', fontSize:'0.97rem' }}>
                            {accDetailLoading ? 'Chargement…' : `Détail — ${accDetail?.driver?.name}`}
                          </strong>
                          {accDetail && <span style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.35)' }}>{accDetail.period?.label}</span>}
                        </div>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          {accDetail && (
                            <button
                              className="adm-btn-ghost" style={{ fontSize:'0.82rem', padding:'6px 14px' }}
                              disabled={accPdfLoading[accDetail.driver.id] || accDetail.summary.rideCount === 0}
                              onClick={() => downloadStatementPdf(accDetail.driver.id)}
                            >
                              {accPdfLoading[accDetail.driver.id] ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} strokeWidth={1.75} />}
                              Bordereau PDF
                            </button>
                          )}
                          <button className="adm-btn-icon-sm" onClick={() => setAccDetail(null)}><X size={16} /></button>
                        </div>
                      </div>

                      {accDetailLoading ? (
                        <div style={{ textAlign:'center', padding:24 }}><Loader2 size={22} className="animate-spin" style={{ color:'#267253' }} /></div>
                      ) : accDetail && (
                        <>
                          {/* Recap financier */}
                          <div className="adm-acc-recap">
                            {[
                              { label:'Courses',          value:`${accDetail.summary.rideCount}`,                  color:'#6366f1' },
                              { label:'CA brut',          value:`${fmt(accDetail.summary.grossRevenue)} €`,        color:'#267253' },
                              { label:`Commission (${accDetail.summary.commissionRate}%)`, value:`– ${fmt(accDetail.summary.commissionAmount)} €`, color:'#f59e0b' },
                              { label:'Net à reverser',   value:`${fmt(accDetail.summary.netAmount)} €`,           color:'#10b981' },
                            ].map((s, i) => (
                              <div key={i} className="adm-acc-recap-item">
                                <span className="adm-acc-recap-value" style={{ color:s.color }}>{s.value}</span>
                                <span className="adm-acc-recap-label">{s.label}</span>
                              </div>
                            ))}
                          </div>

                          {/* Liste des courses */}
                          {accDetail.rides.length === 0 ? (
                            <div style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.85rem', padding:'12px 0' }}>Aucune course sur cette période.</div>
                          ) : (
                            <div className="adm-table-wrap" style={{ marginTop:16 }}>
                              <table className="adm-table" style={{ fontSize:'0.82rem' }}>
                                <thead>
                                  <tr><th>N°</th><th>Date</th><th>Trajet</th><th>Dist.</th><th style={{ textAlign:'right' }}>Prix</th></tr>
                                </thead>
                                <tbody>
                                  {accDetail.rides.map(r => (
                                    <tr key={r.id}>
                                      <td style={{ color:'#267253', fontWeight:700, fontSize:'0.78rem' }}>{r.reservationNumber}</td>
                                      <td style={{ color:'rgba(255,255,255,0.55)', whiteSpace:'nowrap' }}>{fmtDate(r.date)}</td>
                                      <td style={{ maxWidth:220 }}>
                                        <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'rgba(255,255,255,0.7)' }}>{r.departureAddress}</div>
                                        <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'rgba(255,255,255,0.38)', fontSize:'0.76rem' }}>→ {r.arrivalAddress}</div>
                                      </td>
                                      <td style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.78rem', whiteSpace:'nowrap' }}>{r.distance ? `${parseFloat(r.distance).toFixed(1)} km` : '—'}</td>
                                      <td style={{ textAlign:'right', color:'#267253', fontWeight:700 }}>{fmt(r.price)} €</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <div className="adm-empty">Cliquez sur une période pour charger les données.</div>
            )}
          </div>
        )}

        {/* ══ TARIFICATION ══════════════════════════════════════════════════════ */}
        {section === 'pricing' && (
          <div className="adm-section">
            <div className="adm-section-header">
              <h1>Tarification</h1>
              <button className="adm-btn-icon" onClick={loadPricing} title="Rafraîchir">
                <RefreshCw size={16} strokeWidth={1.75} />
              </button>
            </div>
            <p className="adm-section-desc">Définissez les tarifs appliqués à toutes les courses de la plateforme. Les modifications sont effectives immédiatement.</p>

            {pricingLoading ? (
              <div className="adm-loader"><Loader2 size={28} className="animate-spin" /></div>
            ) : (
              <div className="adm-pricing-grid">

                {/* Formulaire */}
                <div className="adm-pricing-card">
                  <div className="adm-pricing-card-title">
                    <SlidersHorizontal size={16} strokeWidth={1.75} style={{ color:'#267253' }} />
                    Paramètres tarifaires
                  </div>

                  <div className="adm-pricing-field">
                    <label>Prix par kilomètre (€/km)</label>
                    <div className="adm-pricing-input-wrap">
                      <input
                        type="number" min="0" step="0.1"
                        className="adm-input"
                        value={pricingForm.pricePerKm}
                        onChange={e => { setPricingForm(p => ({ ...p, pricePerKm: e.target.value })); setPricingMsg({ text:'', ok:true }); }}
                      />
                      <span className="adm-pricing-unit">€/km</span>
                    </div>
                    <p className="adm-pricing-hint">Tarif de base appliqué à chaque kilomètre parcouru.</p>
                  </div>

                  <div className="adm-pricing-field">
                    <label>Prix minimum garanti (€)</label>
                    <div className="adm-pricing-input-wrap">
                      <input
                        type="number" min="0" step="0.5"
                        className="adm-input"
                        value={pricingForm.minimumPrice}
                        onChange={e => { setPricingForm(p => ({ ...p, minimumPrice: e.target.value })); setPricingMsg({ text:'', ok:true }); }}
                      />
                      <span className="adm-pricing-unit">€</span>
                    </div>
                    <p className="adm-pricing-hint">Montant minimum facturé quelle que soit la distance.</p>
                  </div>

                  <div className="adm-pricing-field">
                    <label>Frais de prise en charge (€)</label>
                    <div className="adm-pricing-input-wrap">
                      <input
                        type="number" min="0" step="0.5"
                        className="adm-input"
                        value={pricingForm.baseFee}
                        onChange={e => { setPricingForm(p => ({ ...p, baseFee: e.target.value })); setPricingMsg({ text:'', ok:true }); }}
                      />
                      <span className="adm-pricing-unit">€</span>
                    </div>
                    <p className="adm-pricing-hint">Frais fixes ajoutés à chaque course (0 = désactivé).</p>
                  </div>

                  <button
                    className="adm-btn-primary"
                    disabled={pricingSaving}
                    onClick={savePricing}
                    style={{ marginTop:8 }}
                  >
                    {pricingSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} strokeWidth={2} />}
                    Enregistrer la tarification
                  </button>

                  {pricingMsg.text && (
                    <div style={{ marginTop:10, fontSize:'0.82rem', color: pricingMsg.ok ? '#10b981' : '#ef4444', display:'flex', alignItems:'center', gap:6 }}>
                      {pricingMsg.ok ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
                      {pricingMsg.text}
                    </div>
                  )}

                  {pricing?.updatedBy && (
                    <div style={{ marginTop:16, fontSize:'0.76rem', color:'rgba(255,255,255,0.3)', borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:12 }}>
                      Dernière mise à jour par <strong style={{ color:'rgba(255,255,255,0.5)' }}>{pricing.updatedBy}</strong>
                      {pricing.updatedAt && <> · {fmtDateTime(pricing.updatedAt)}</>}
                    </div>
                  )}
                </div>

                {/* Aperçu des prix */}
                <div className="adm-pricing-card">
                  <div className="adm-pricing-card-title">
                    <TrendingUp size={16} strokeWidth={1.75} style={{ color:'#6366f1' }} />
                    Aperçu des tarifs
                  </div>
                  <p style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.35)', marginBottom:16 }}>
                    Prix calculés en temps réel avec les valeurs du formulaire.
                  </p>
                  <table className="adm-table" style={{ marginTop:0 }}>
                    <thead>
                      <tr>
                        <th>Distance</th>
                        <th style={{ textAlign:'right' }}>Prix estimé</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[5, 10, 15, 20, 30, 50].map(km => {
                        const ppkm = parseFloat(pricingForm.pricePerKm) || 0;
                        const min  = parseFloat(pricingForm.minimumPrice) || 0;
                        const base = parseFloat(pricingForm.baseFee) || 0;
                        const raw  = base + km * ppkm;
                        const price = Math.round(Math.max(min, raw) * 100) / 100;
                        const isMin = price === min && raw < min;
                        return (
                          <tr key={km}>
                            <td style={{ color:'rgba(255,255,255,0.65)', fontWeight:500 }}>{km} km</td>
                            <td style={{ textAlign:'right', color: isMin ? '#f59e0b' : '#267253', fontWeight:700 }}>
                              {fmt(price)} €
                              {isMin && <span style={{ fontSize:'0.7rem', color:'#f59e0b', marginLeft:6, fontWeight:400 }}>min.</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div style={{ marginTop:16, padding:'10px 14px', background:'rgba(38,114,83,0.06)', borderRadius:8, border:'1px solid rgba(38,114,83,0.15)', fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', lineHeight:1.6 }}>
                    <strong style={{ color:'rgba(255,255,255,0.65)' }}>Formule :</strong><br/>
                    Prix = max(minimum, frais_base + distance × prix_km)
                  </div>
                </div>

              </div>
            )}
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

      {/* ── Modal carte de visite (module Contact) ───────────────────────────── */}
      <AnimatePresence>
        {openContactId && (
          <ContactModal
            contactId={openContactId}
            onClose={() => setOpenContactId(null)}
            onSaved={loadContacts}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
