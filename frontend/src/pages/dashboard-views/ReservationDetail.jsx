import { useState, useEffect } from 'react';
import {
  ClipboardList, MapPin, Calendar, MessageSquare, Calculator, Euro,
  AlertTriangle, CheckCircle, XCircle, FileText, Receipt,
} from 'lucide-react';
import { reservationAPI, downloadBlob } from '../../services/api';
import { STATUS_LABELS } from './statusLabels';

export default function ReservationDetail({ reservation, onClose, onUpdate, showToast }) {
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Fermeture avec la touche Echap
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
      onUpdate();
      onClose();
      showToast(`Réservation ${label}.`, 'success');
    } catch (err) {
      setActionError(err.response?.data?.error || 'Erreur lors de la mise à jour.');
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async (type) => {
    try {
      const fn = type === 'reservation'
        ? reservationAPI.downloadReservationPdf
        : reservationAPI.downloadInvoicePdf;
      const { data } = await fn(reservation.id);
      downloadBlob(data, `${type}-${reservation.reservationNumber}.pdf`);
    } catch (err) {
      showToast('Erreur lors du téléchargement du PDF.', 'error');
    }
  };

  const s = STATUS_LABELS[reservation.status];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '620px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="icon-heading"><ClipboardList size={16} strokeWidth={1.5} /> {reservation.reservationNumber}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span className={`badge ${s.badge} inline-flex items-center gap-1`}><s.Icon size={12} strokeWidth={1.5} /> {s.label}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-gray)' }}>
              {new Date(reservation.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Client', value: `${reservation.firstName} ${reservation.lastName}` },
              { label: 'Téléphone', value: reservation.phone },
              { label: 'Email', value: reservation.email },
              { label: 'Passagers / Bagages', value: `${reservation.passengers} pax – ${reservation.luggage} bag.` },
            ].map((item, i) => (
              <div key={i} style={{ background: 'var(--color-light)', padding: '10px 14px', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-gray)', textTransform: 'uppercase', marginBottom: '4px' }}>{item.label}</div>
                <div style={{ fontWeight: '600', fontSize: '0.92rem' }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: 'var(--color-light)', padding: '14px', borderRadius: 'var(--radius)', marginBottom: '12px' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-gray)', textTransform: 'uppercase', marginBottom: '8px' }}>Trajet</div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={11} strokeWidth={2} /> Départ</div>
                <div style={{ fontSize: '0.9rem', marginTop: '2px' }}>{reservation.departureAddress}</div>
              </div>
              <div style={{ color: 'var(--color-gray)' }}>→</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-error)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={11} strokeWidth={2} /> Arrivée</div>
                <div style={{ fontSize: '0.9rem', marginTop: '2px' }}>{reservation.arrivalAddress}</div>
              </div>
            </div>
            <div style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--color-gray)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={13} strokeWidth={1.5} /> {new Date(reservation.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} à {reservation.time}
            </div>
          </div>

          {reservation.comments && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '12px', borderRadius: 'var(--radius)', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.78rem', color: '#92400e', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><MessageSquare size={11} strokeWidth={1.5} /> Commentaires</div>
              <div style={{ fontSize: '0.9rem' }}>{reservation.comments}</div>
            </div>
          )}

          {reservation.estimatedPrice && !reservation.price && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', padding: '12px', borderRadius: 'var(--radius)', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.78rem', color: '#92400e', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Calculator size={11} strokeWidth={1.5} /> Prix estimé</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <span style={{ fontSize: '1.3rem', fontWeight: '700', color: '#92400e' }}>
                  {Number(reservation.estimatedPrice).toFixed(2)} €
                </span>
                {reservation.distance && (
                  <span style={{ fontSize: '0.85rem', color: '#b45309' }}>
                    {Number(reservation.distance).toFixed(1)} km
                  </span>
                )}
              </div>
            </div>
          )}

          {reservation.price && (
            <div style={{ background: '#ecfdf5', border: '1px solid #bbf7d0', padding: '12px', borderRadius: 'var(--radius)', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.78rem', color: '#065f46', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><Euro size={11} strokeWidth={1.5} /> Montant final</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: '700', color: '#065f46' }}>
                  {Number(reservation.price).toFixed(2)} €
                </span>
                {reservation.distance && (
                  <span style={{ fontSize: '0.85rem', color: '#065f46' }}>
                    {Number(reservation.distance).toFixed(1)} km
                  </span>
                )}
              </div>
            </div>
          )}

          {actionError && (
            <div className="alert alert-error" style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><AlertTriangle size={14} strokeWidth={1.5} /> {actionError}</div>
          )}

          {/* Actions statut */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
            {reservation.status === 'pending' && (
              <button className="btn btn-sm" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => updateStatus('confirmed')} disabled={loading}>
                <CheckCircle size={13} strokeWidth={1.5} /> Confirmer
              </button>
            )}
            {reservation.status !== 'cancelled' && reservation.status !== 'completed' && (
              <button className="btn btn-sm" style={{ background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => updateStatus('cancelled')} disabled={loading}>
                <XCircle size={13} strokeWidth={1.5} /> Annuler
              </button>
            )}
          </div>

          {/* Téléchargements PDF */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
            <button className="btn btn-sm btn-dark" style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => downloadPdf('reservation')}>
              <FileText size={13} strokeWidth={1.5} /> Bon réservation
            </button>
            {reservation.status === 'completed' && reservation.price && (
              <button className="btn btn-sm" style={{ background: 'var(--color-accent)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => downloadPdf('invoice')}>
                <Receipt size={13} strokeWidth={1.5} /> Facture PDF
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
