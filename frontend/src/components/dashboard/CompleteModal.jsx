import { useState } from 'react';
import { motion } from 'framer-motion';
import { Euro, CheckCircle, XCircle, AlertCircle, Loader2, FileText } from 'lucide-react';
import { reservationAPI } from '../../services/api';

export default function CompleteModal({ reservation, onClose, onSuccess }) {
  const [price, setPrice] = useState(
    reservation.estimatedPrice ? String(Number(reservation.estimatedPrice).toFixed(2)) : ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!price || parseFloat(price) <= 0) { setError('Veuillez saisir un prix valide.'); return; }
    setLoading(true);
    try {
      const { data } = await reservationAPI.complete(reservation.id, price);
      onSuccess(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la validation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#111118] border border-white/10 rounded-2xl p-8 w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <CheckCircle size={18} strokeWidth={1.5} className="text-[#D4AF37]" />
            Valider la course
          </h3>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
            <XCircle size={20} strokeWidth={1.5} />
          </button>
        </div>

        <p className="text-white/40 text-sm mb-6 leading-relaxed">
          <span className="text-white/70">{reservation.departureAddress}</span>
          {' → '}
          <span className="text-white/70">{reservation.arrivalAddress}</span>
          <br />
          Client : <span className="text-white/70">{reservation.firstName} {reservation.lastName}</span>
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2 mb-4">
            <AlertCircle size={16} strokeWidth={1.5} className="text-red-400 shrink-0" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-white/50 uppercase tracking-widest flex items-center gap-1.5">
              <Euro size={14} strokeWidth={1.5} />
              Prix de la course (€) *
            </label>
            <input
              type="number" className="input-dark"
              value={price} onChange={e => { setPrice(e.target.value); setError(''); }}
              placeholder="Ex: 45.00" step="0.01" min="1" autoFocus
            />
            {reservation.estimatedPrice && (
              <p className="text-white/30 text-xs">
                Prix estimé : <strong className="text-white/50">{Number(reservation.estimatedPrice).toFixed(2)} €</strong>
                {reservation.distance && ` (${Number(reservation.distance).toFixed(1)} km)`}
              </p>
            )}
          </div>
          <div className="bg-white/3 border border-white/5 rounded-xl p-3">
            <p className="text-white/30 text-xs flex items-center gap-2">
              <FileText size={13} strokeWidth={1.5} />
              Une facture PDF sera générée et envoyée au client par email.
            </p>
          </div>
          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-white/15 text-white/60 py-3 rounded-xl text-sm font-medium hover:border-white/30 transition-colors">
              Annuler
            </button>
            <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="flex-1 bg-white text-black font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
              {loading
                ? <><Loader2 size={16} strokeWidth={1.5} className="animate-spin" /> Validation...</>
                : <><CheckCircle size={16} strokeWidth={1.5} /> Valider &amp; Facture</>}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
