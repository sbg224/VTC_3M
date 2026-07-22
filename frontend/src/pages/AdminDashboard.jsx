import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, ClipboardList, UserCheck, Bell,
  LogOut, MoreHorizontal, Home,
  MessageSquare,
  SlidersHorizontal,
  Calculator,
  IdCard,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../services/auth';
import { adminAPI, accountingAPI, contactAdminAPI, downloadBlob } from '../services/api';
import DriverModal from './admin-dashboard/DriverModal';
import ContactModal from './admin-dashboard/ContactModal';
import OverviewSection from './admin-dashboard/OverviewSection';
import ClientsSection from './admin-dashboard/ClientsSection';
import NotificationsSection from './admin-dashboard/NotificationsSection';
import InscriptionsSection from './admin-dashboard/InscriptionsSection';
import DriversSection from './admin-dashboard/DriversSection';
import ReservationsSection from './admin-dashboard/ReservationsSection';
import ContactsSection from './admin-dashboard/ContactsSection';
import PricingSection from './admin-dashboard/PricingSection';
import AccountingSection from './admin-dashboard/AccountingSection';

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
        {section === 'overview' && <OverviewSection stats={stats} loading={statsLoading} pendingCount={pendingCount} onRefresh={loadStats} onNavigate={setSection} />}

        {/* ══ INSCRIPTIONS ══════════════════════════════════════════════════════ */}
        {section === 'inscriptions' && (
          <InscriptionsSection
            drivers={drivers}
            driversLoading={driversLoading}
            onRefresh={loadDrivers}
            onValidate={async (id) => { await adminAPI.updateStatus(id, 'trial'); loadDrivers(); loadStats(); }}
            onReject={async (id) => { await adminAPI.updateStatus(id, 'suspended'); loadDrivers(); loadStats(); }}
            onSelectDriver={setSelectedDriver}
          />
        )}

        {/* ══ CRM CHAUFFEURS ════════════════════════════════════════════════════ */}
        {section === 'drivers' && (
          <DriversSection
            drivers={drivers}
            driversTotal={driversTotal}
            driverPage={driverPage}
            driverFilter={driverFilter}
            driverSearch={driverSearch}
            driversLoading={driversLoading}
            pendingCount={pendingCount}
            onSearchChange={(v) => { setDriverSearch(v); setDriverPage(1); }}
            onFilterChange={(v) => { setDriverFilter(v); setDriverPage(1); }}
            onPage={setDriverPage}
            onRefresh={loadDrivers}
            onSelectDriver={setSelectedDriver}
          />
        )}

        {/* ══ COURSES GLOBALES ══════════════════════════════════════════════════ */}
        {section === 'reservations' && (
          <ReservationsSection
            reservations={reservations}
            resTotal={resTotal}
            resPage={resPage}
            resFilter={resFilter}
            resSearch={resSearch}
            resLoading={resLoading}
            onSearchChange={(v) => { setResSearch(v); setResPage(1); }}
            onFilterChange={(v) => { setResFilter(v); setResPage(1); }}
            onPage={setResPage}
            onRefresh={loadReservations}
          />
        )}

        {/* ══ CRM CLIENTS ═══════════════════════════════════════════════════════ */}
        {section === 'clients' && (
          <ClientsSection
            clients={clients}
            clientsTotal={clientsTotal}
            clientPage={clientPage}
            clientSearch={clientSearch}
            clientsLoading={clientsLoading}
            onSearchChange={(v) => { setClientSearch(v); setClientPage(1); }}
            onPage={setClientPage}
          />
        )}

        {/* ══ CARTES DE VISITE (module Contact) ═════════════════════════════════ */}
        {section === 'contacts' && (
          <ContactsSection
            contactsList={contactsList}
            contactsTotal={contactsTotal}
            contactPage={contactPage}
            contactSearch={contactSearch}
            contactsLoading={contactsLoading}
            onSearchChange={(v) => { setContactSearch(v); setContactPage(1); }}
            onPage={setContactPage}
            onCreate={() => setOpenContactId('new')}
            onEdit={setOpenContactId}
            onDelete={deleteContact}
            onTogglePublic={toggleContactPublic}
          />
        )}

        {/* ══ NOTIFICATIONS ═════════════════════════════════════════════════════ */}
        {section === 'notifications' && (
          <NotificationsSection
            broadcast={broadcast}
            setBroadcast={setBroadcast}
            broadcastSending={broadcastSending}
            broadcastResult={broadcastResult}
            onSendBroadcast={sendBroadcast}
            onNavigate={setSection}
          />
        )}

        {/* ══ COMPTABILITÉ ══════════════════════════════════════════════════════ */}
        {section === 'accounting' && (
          <AccountingSection
            accPeriod={accPeriod}
            accStart={accStart}
            accEnd={accEnd}
            accSummary={accSummary}
            accTotals={accTotals}
            accPeriodLabel={accPeriodLabel}
            accLoading={accLoading}
            accDetail={accDetail}
            accDetailLoading={accDetailLoading}
            accPdfLoading={accPdfLoading}
            accEditComm={accEditComm}
            accCommSaving={accCommSaving}
            onPeriodChange={(id) => { setAccPeriod(id); if (id !== 'custom') loadAccounting(id); }}
            onStartChange={setAccStart}
            onEndChange={setAccEnd}
            onApplyCustom={() => loadAccounting('custom', accStart, accEnd)}
            onRefresh={() => loadAccounting()}
            onStartEditCommission={(id, rate) => setAccEditComm(p => ({ ...p, [id]: String(rate) }))}
            onCommissionInputChange={(id, v) => setAccEditComm(p => ({ ...p, [id]: v }))}
            onCancelEditCommission={(id) => setAccEditComm(p => { const n = { ...p }; delete n[id]; return n; })}
            onSaveCommission={saveCommission}
            onDownloadPdf={downloadStatementPdf}
            onViewDetail={loadAccDetail}
            onCloseDetail={() => setAccDetail(null)}
          />
        )}

        {/* ══ TARIFICATION ══════════════════════════════════════════════════════ */}
        {section === 'pricing' && (
          <PricingSection
            pricing={pricing}
            pricingForm={pricingForm}
            pricingLoading={pricingLoading}
            pricingSaving={pricingSaving}
            pricingMsg={pricingMsg}
            onFieldChange={(field, value) => { setPricingForm(p => ({ ...p, [field]: value })); setPricingMsg({ text:'', ok:true }); }}
            onSave={savePricing}
            onRefresh={loadPricing}
          />
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
