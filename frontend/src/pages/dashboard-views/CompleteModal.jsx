import { useState } from 'react';
import { Flag, CheckCircle, Clock } from 'lucide-react';
import { reservationAPI } from '../../services/api';

export default function CompleteModal({ reservation, onClose, onSuccess }) {
  const [price, setPrice] = useState(
    reservation.estimatedPrice ? String(Number(reservation.estimatedPrice).toFixed(2)) : ''
  );
  const [actualDistance, setActualDistance] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Le kilométrage n'est demandé qu'en mise à disposition : un transfert a déjà
  // sa distance, calculée à la réservation. Au-delà du forfait inclus, les
  // kilomètres sont facturés en supplément par le serveur.
  const isHourly = reservation.serviceType === 'mise_a_disposition';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!price || parseFloat(price) <= 0) {
      setError('Veuillez saisir un prix valide.');
      return;
    }
    if (isHourly && actualDistance !== '' && parseFloat(actualDistance) < 0) {
      setError('Veuillez saisir un kilométrage valide.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await reservationAPI.complete(
        reservation.id, price, isHourly && actualDistance !== '' ? actualDistance : undefined,
      );
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
              {isHourly ? (
                <>
                  Mise à disposition : <strong>{reservation.serviceDurationHours} h</strong> au départ de <strong>{reservation.departureAddress}</strong><br />
                </>
              ) : (
                <>
                  Course : <strong>{reservation.departureAddress}</strong> → <strong>{reservation.arrivalAddress}</strong><br />
                </>
              )}
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
                  {isHourly
                    ? ' (part horaire seule — le supplément kilométrique s\'y ajoutera)'
                    : reservation.distance ? ` (${Number(reservation.distance).toFixed(1)} km)` : ''}
                </div>
              )}
            </div>
            {isHourly && (
              <div className="form-group">
                <label className="form-label">Kilométrage réellement parcouru (km)</label>
                <input
                  type="number" className="form-control" value={actualDistance}
                  onChange={e => { setActualDistance(e.target.value); setError(''); }}
                  placeholder="Ex: 70" step="0.1" min="0"
                />
                <div style={{ fontSize: '0.82rem', color: 'var(--color-gray)', marginTop: '6px' }}>
                  Les kilomètres dépassant le forfait inclus seront ajoutés au prix ci-dessus.
                  Laissez vide si le forfait n'a pas été dépassé.
                </div>
              </div>
            )}
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
