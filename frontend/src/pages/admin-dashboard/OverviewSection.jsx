import { AlertTriangle, Ban, CheckCircle, ClipboardList, Clock, Euro, Flag, TrendingUp, Users, Zap, ChevronRight, RefreshCw, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import KpiCard from './KpiCard';
import { fmt } from './adminHelpers';

export default function OverviewSection({ stats, loading, pendingCount, onRefresh, onNavigate }) {
  return (
    <div className="adm-section">
      <div className="adm-section-header"><h1>Vue d'ensemble</h1><button className="adm-btn-icon" onClick={onRefresh} title="Rafraîchir"><RefreshCw size={16} strokeWidth={1.75} /></button></div>
      {loading ? <div className="adm-loader"><Loader2 size={28} className="animate-spin" /></div> : stats ? <>
        <div className="adm-kpi-section-title">Chauffeurs</div><div className="adm-kpi-grid">
          <KpiCard icon={<Users size={20} strokeWidth={1.5} />} value={stats.drivers.total} label="Total inscrits" color="#6366f1" onClick={() => onNavigate('drivers')} />
          <KpiCard icon={<Clock size={20} strokeWidth={1.5} />} value={stats.drivers.byStatus.pending} label="En attente validation" color="#f59e0b" sub="Nécessite action" onClick={() => onNavigate('inscriptions')} />
          <KpiCard icon={<Zap size={20} strokeWidth={1.5} />} value={stats.drivers.byStatus.trial} label="En essai" color="#6366f1" /><KpiCard icon={<CheckCircle size={20} strokeWidth={1.5} />} value={stats.drivers.byStatus.active} label="Actifs" color="#10b981" /><KpiCard icon={<Ban size={20} strokeWidth={1.5} />} value={stats.drivers.byStatus.suspended} label="Suspendus" color="#ef4444" />
        </div>
        <div className="adm-kpi-section-title" style={{ marginTop: 28 }}>Courses & Revenus</div><div className="adm-kpi-grid">
          <KpiCard icon={<ClipboardList size={20} strokeWidth={1.5} />} value={stats.reservations.total} label="Total réservations" color="#267253" onClick={() => onNavigate('reservations')} /><KpiCard icon={<Flag size={20} strokeWidth={1.5} />} value={stats.reservations.completed} label="Courses terminées" color="#10b981" /><KpiCard icon={<Clock size={20} strokeWidth={1.5} />} value={stats.reservations.pending} label="En attente" color="#f59e0b" /><KpiCard icon={<Euro size={20} strokeWidth={1.5} />} value={`${fmt(stats.revenue.total)} €`} label="Revenus totaux" color="#267253" /><KpiCard icon={<TrendingUp size={20} strokeWidth={1.5} />} value={`${fmt(stats.revenue.month)} €`} label="Ce mois-ci" color="#6366f1" />
        </div>
        {pendingCount > 0 && <motion.div className="adm-alert" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><AlertTriangle size={16} strokeWidth={2} /><span><strong>{pendingCount} inscription(s)</strong> en attente de validation.</span><button className="adm-alert-btn" onClick={() => onNavigate('inscriptions')}>Voir <ChevronRight size={14} /></button></motion.div>}
      </> : <div className="adm-empty">Impossible de charger les statistiques.</div>}
    </div>
  );
}
