import { Clock, CheckCircle, XCircle } from 'lucide-react';

export const STATUS_CONFIG = {
  pending:   { label: 'En attente', classes: 'bg-yellow-500/20 text-yellow-400', Icon: Clock },
  confirmed: { label: 'Confirmée',  classes: 'bg-blue-500/20 text-blue-400',    Icon: CheckCircle },
  completed: { label: 'Terminée',   classes: 'bg-green-500/20 text-green-400',  Icon: CheckCircle },
  cancelled: { label: 'Annulée',    classes: 'bg-red-500/20 text-red-400',      Icon: XCircle },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.classes}`}>
      <Icon size={11} strokeWidth={1.5} />
      {cfg.label}
    </span>
  );
}
