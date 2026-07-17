import { useState } from 'react';
import { Flag, CheckCircle, Clock } from 'lucide-react';
import { reservationAPI } from '../../services/api';

export default function CompleteModal({ reservation, onClose, onSuccess }) {
  const [price, setPrice] = useState(
    reservation.estimatedPrice ? String(Number(reservation.estimatedPrice).toFixed(2)) : ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!price || parseFloat(price) <= 0) {
      setError('Veuillez saisir un prix valide.');
      return;
    }
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="icon-heading"><Flag size={16} strokeWidth={1.5} /> Valider la course – {reservation.reservationNumber}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <p style={{ color: 'var(--color-gray)', marginBottom: '20px', fontSize: '0.95rem' }}>
              Course : <strong>{reservation.departureAddress}</strong> → <strong>{reservation.arrivalAddress}</strong><br />
              Client : <strong>{reservation.firstName} {reservation.lastName}</strong>
            </p>
            <div className="form-group">
              <label className="form-label">Prix de la course (€) <span>*</span></label>
              <input
                type="number" className="form-control" value={price}
                onChange={e => { setPrice(e.target.value); setError(''); }}
                placeholder="Ex: 45.00" step="0.01" min="1" autoFocus
              />
              {reservation.estimatedPrice && (
                <div style={{ fontSize: '0.82rem', color: 'var(--color-gray)', marginTop: '6px' }}>
                  Prix estimé à la réservation : <strong>{Number(reservation.estimatedPrice).toFixed(2)} €</strong>
                  {reservation.distance && ` (${Number(reservation.distance).toFixed(1)} km)`}
                </div>
              )}
            </div>
            <div className="alert alert-info" style={{ marginBottom: 0 }}>
              Une facture PDF sera générée automatiquement et envoyée au client par email.
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline"
              style={{ color: 'var(--color-primary)', borderColor: 'var(--color-gray-light)' }}
              onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><Clock size={14} className="animate-spin" /> Validation...</> : <><CheckCircle size={14} strokeWidth={1.5} /> Valider &amp; Générer facture</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
