import { useState, useEffect } from 'react';
import {
  UserCog, X, Loader2, Mail, Phone, Zap, CheckCircle, Ban, XCircle,
  Bell, ChevronUp, ChevronDown, Send,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../services/api';
import { fmt, fmtDate, STATUS_RES } from './adminHelpers';
import DriverBadge from './DriverBadge';

export default function DriverModal({ driverId, onClose, onStatusChange }) {
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
    } catch (err) {
      setSent(err.response?.data?.error || 'Erreur lors de l\'envoi. Vérifiez la config email.');
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
          <div style={{ padding: 48, textAlign: 'center' }}><Loader2 size={28} className="animate-spin" style={{ color: '#267253' }} /></div>
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
                { label: 'Revenus',          value: `${fmt(data.stats.totalRevenue)} €`, color: '#267253' },
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
              <div><span>Plan</span><strong style={{ color:'#267253', textTransform:'uppercase' }}>{data.driver.plan}</strong></div>
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
                      {r.price && <span style={{ color:'#267253', fontSize:'0.82rem', fontWeight:700 }}>{fmt(r.price)} €</span>}
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
