import { Clock, Zap, CheckCircle, Ban, XCircle } from 'lucide-react';

// Partagé entre DriverModal, DriverBadge et AdminDashboard (vue principale).
export const fmt = (n) => new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(n ?? 0);
export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : '—';
export const fmtDateTime = (d) => d ? new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—';

export const STATUS_DRIVER = {
  pending:   { label: 'En attente',  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  Icon: Clock },
  trial:     { label: 'Essai',       color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  Icon: Zap },
  active:    { label: 'Actif',       color: '#10b981', bg: 'rgba(16,185,129,0.12)',  Icon: CheckCircle },
  suspended: { label: 'Suspendu',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   Icon: Ban },
  expired:   { label: 'Expiré',      color: '#6b7280', bg: 'rgba(107,114,128,0.12)', Icon: XCircle },
};

export const STATUS_RES = {
  pending:   { label: 'En attente',  cls: 'badge-pending' },
  confirmed: { label: 'Confirmée',   cls: 'badge-confirmed' },
  completed: { label: 'Terminée',    cls: 'badge-completed' },
  cancelled: { label: 'Annulée',     cls: 'badge-cancelled' },
};
