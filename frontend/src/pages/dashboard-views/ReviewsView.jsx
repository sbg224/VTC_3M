import { Star, RefreshCw, MapPin } from 'lucide-react';
import StarsDisplay from './StarsDisplay';

export default function ReviewsView({ reviews, reviewsMeta, reviewsLoading }) {
  return (
    <>
      <div className="dashboard-header">
        <h1 className="icon-heading"><Star size={22} strokeWidth={1.5} /> Avis clients</h1>
        <p>Ce que vos clients disent de vous</p>
      </div>

      {reviewsLoading ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--color-accent)', margin: '0 auto' }} />
        </div>
      ) : (
        <>
          {/* Résumé note globale */}
          {reviewsMeta && (
            <div className="reviews-summary-card">
              <div className="reviews-big-score">
                <span className="reviews-score-num">{reviewsMeta.average || '—'}</span>
                <span className="reviews-score-denom">/5</span>
              </div>
              <div>
                <StarsDisplay value={reviewsMeta.average} size={20} />
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', marginTop: 4 }}>
                  {reviewsMeta.total} avis reçus
                </p>
                {/* Répartition barres */}
                {reviewsMeta.distribution && (
                  <div className="reviews-dist">
                    {[...reviewsMeta.distribution].reverse().map(d => {
                      const pct = reviewsMeta.total > 0 ? Math.round(d.count / reviewsMeta.total * 100) : 0;
                      return (
                        <div key={d.rating} className="reviews-dist-row">
                          <span className="reviews-dist-label">{d.rating}</span>
                          <Star size={10} strokeWidth={1.5} fill="#267253" color="#267253" />
                          <div className="reviews-dist-bar">
                            <div style={{ width: `${pct}%`, height: '100%', background: '#267253', borderRadius: 3, transition: 'width 0.4s ease' }} />
                          </div>
                          <span className="reviews-dist-count">{d.count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Liste des avis */}
          {reviews.length === 0 ? (
            <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <Star size={36} strokeWidth={1} style={{ color: 'rgba(38,114,83,0.3)', marginBottom: 12 }} />
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                Aucun avis pour l'instant. Les avis arrivent automatiquement après chaque course terminée.
              </p>
            </div>
          ) : (
            <div className="reviews-list">
              {reviews.map(r => (
                <div key={r.id} className="review-card">
                  <div className="review-card-header">
                    <div>
                      <span className="review-client-name">{r.clientName}</span>
                      {r.reservation && (
                        <span className="review-res-num"> · {r.reservation.reservationNumber}</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <StarsDisplay value={r.rating} size={13} />
                      <span className="review-date">
                        {new Date(r.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  {r.reservation && (
                    <div className="review-trip">
                      <MapPin size={11} strokeWidth={1.5} />
                      {r.reservation.departureAddress?.slice(0, 35)} → {r.reservation.arrivalAddress?.slice(0, 30)}
                    </div>
                  )}
                  {r.comment && (
                    <p className="review-comment">"{r.comment}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
