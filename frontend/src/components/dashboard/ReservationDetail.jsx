import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  XCircle, CheckCircle, AlertCircle, ArrowRight,
  MapPin, Phone, Mail, Users, Briefcase, CalendarDays, FileText,
} from 'lucide-react';
import { reservationAPI, downloadBlob } from '../../services/api';
import StatusBadge from './StatusBadge';

export default function ReservationDetail({ reservation, onClose, onUpdate, showToast }) {
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const updateStatus = async (status) => {
    const label = status === 'confirmed' ? 'confirmée' : 'annulée';
    setActionError('');
    setLoading(true);
    try {
      await reservationAPI.updateStatus(reservation.id, status);
      onUpdate(); onClose();
      showToast(`Réservation ${label}.`, 'success');
    } catch (err) {
      setActionError(err.response?.data?.error || 'Erreur lors de la mise à jour.');
    } finally { setLoading(false); }
  };

  const downloadPdf = async (type) => {
    try {
      const fn = type === 'reservation' ? reservationAPI.downloadReservationPdf : reservationAPI.downloadInvoicePdf;
      const { data } = await fn(reservation.id);
      downloadBlob(data, `${type}-${reservation.reservationNumber}.pdf`);
    } catch { showToast('Erreur lors du téléchargement du PDF.', 'error'); }
  };

  const clientInfo = [
    { label: 'Client',              value: `${reservation.firstName} ${reservation.lastName}`, Icon: Users },
    { label: 'Téléphone',           value: reservation.phone,  Icon: Phone },
    { label: 'Email',               value: reservation.email,  Icon: Mail },
    { label: 'Passagers / Bagages', value: `${reservation.passengers} pax — ${reservation.luggage} bag.`, Icon: Briefcase },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#111118] border border-white/10 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/8">
          <div>
            <h3 className="text-white font-semibold">{reservation.reservationNumber}</h3>
            <p className="text-white/40 text-xs mt-0.5">
              {new Date(reservation.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={reservation.status} />
            <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
              <XCircle size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            {clientInfo.map((item, i) => (
              <div key={i} className="bg-white/3 border border-white/5 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-white/50 text-xs mb-1 uppercase tracking-widest">
                  <item.Icon size={11} strokeWidth={1.5} />
                  {item.label}
                </div>
                <div className="text-white text-sm font-medium">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="bg-white/3 border border-white/5 rounded-xl p-4">
            <div className="text-white/50 text-xs uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <MapPin size={11} strokeWidth={1.5} />
              Trajet
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <div className="text-green-400 text-xs font-semibold mb-1">Départ</div>
                <div className="text-white text-sm">{reservation.departureAddress}</div>
              </div>
              <ArrowRight size={16} strokeWidth={1.5} className="text-white/50 mt-1 shrink-0" />
              <div className="flex-1">
                <div className="text-red-400 text-xs font-semibold mb-1">Arrivée</div>
                <div className="text-white text-sm">{reservation.arrivalAddress}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-white/40 text-xs">
              <CalendarDays size={12} strokeWidth={1.5} />
              {new Date(reservation.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {reservation.time}
            </div>
          </div>

          {reservation.comments && (
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4">
              <div className="text-amber-400/70 text-xs uppercase tracking-widest mb-2">Commentaires</div>
              <div className="text-white/70 text-sm">{reservation.comments}</div>
            </div>
          )}

          {reservation.estimatedPrice && !reservation.price && (
            <div className="bg-white/3 border border-white/8 rounded-xl p-4">
              <div className="text-white/50 text-xs uppercase tracking-widest mb-2">Prix estimé</div>
              <div className="flex items-baseline gap-3">
                <span className="text-[#D4AF37] text-2xl font-bold">{Number(reservation.estimatedPrice).toFixed(2)} €</span>
                {reservation.distance && <span className="text-white/30 text-sm">{Number(reservation.distance).toFixed(1)} km</span>}
              </div>
            </div>
          )}

          {reservation.price && (
            <div className="bg-green-500/5 border border-green-500/15 rounded-xl p-4">
              <div className="text-green-400/70 text-xs uppercase tracking-widest mb-2">Montant final</div>
              <div className="flex items-baseline gap-3">
                <span className="text-green-400 text-2xl font-bold">{Number(reservation.price).toFixed(2)} €</span>
                {reservation.distance && <span className="text-green-400/40 text-sm">{Number(reservation.distance).toFixed(1)} km</span>}
              </div>
            </div>
          )}

          {actionError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2">
              <AlertCircle size={16} strokeWidth={1.5} className="text-red-400 shrink-0" />
              <span className="text-red-400 text-sm">{actionError}</span>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {reservation.status === 'pending' && (
              <button
                className="bg-blue-500/15 text-blue-400 border border-blue-500/20 px-4 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 hover:bg-blue-500/25 transition-colors disabled:opacity-50"
                onClick={() => updateStatus('confirmed')} disabled={loading}
              >
                <CheckCircle size={13} strokeWidth={1.5} />
                Confirmer
              </button>
            )}
            {reservation.status !== 'cancelled' && reservation.status !== 'completed' && (
              <button
                className="bg-red-500/15 text-red-400 border border-red-500/20 px-4 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 hover:bg-red-500/25 transition-colors disabled:opacity-50"
                onClick={() => updateStatus('cancelled')} disabled={loading}
              >
                <XCircle size={13} strokeWidth={1.5} />
                Annuler
              </button>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              className="bg-white/5 border border-white/10 text-white/60 px-4 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 hover:bg-white/10 transition-colors"
              onClick={() => downloadPdf('reservation')}
            >
              <FileText size={13} strokeWidth={1.5} />
              Bon réservation
            </button>
            {reservation.status === 'completed' && reservation.price && (
              <button
                className="bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/20 px-4 py-2 rounded-full text-xs font-medium flex items-center gap-1.5 hover:bg-[#D4AF37]/25 transition-colors"
                onClick={() => downloadPdf('invoice')}
              >
                <FileText size={13} strokeWidth={1.5} />
                Facture PDF
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
