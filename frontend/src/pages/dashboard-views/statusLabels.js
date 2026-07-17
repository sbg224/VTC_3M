import { Clock, CheckCircle, Flag, XCircle } from 'lucide-react';

// Partagé entre Dashboard (liste réservations) et ReservationDetail (modal).
export const STATUS_LABELS = {
  pending:   { label: 'En attente', badge: 'badge-pending',   Icon: Clock },
  confirmed: { label: 'Confirmée',  badge: 'badge-confirmed', Icon: CheckCircle },
  completed: { label: 'Terminée',   badge: 'badge-completed', Icon: Flag },
  cancelled: { label: 'Annulée',    badge: 'badge-cancelled', Icon: XCircle },
};
