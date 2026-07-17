import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, CheckCircle, AlertTriangle, Loader2, Car, MapPin, Calendar } from 'lucide-react';
import api from '../services/api';
import Seo from '../components/Seo';

function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{
            background: 'none', border: 'none', cursor: readonly ? 'default' : 'pointer',
            padding: 4, transition: 'transform 0.15s ease',
            transform: !readonly && (hovered >= n || value >= n) ? 'scale(1.15)' : 'scale(1)',
          }}
        >
          <Star
            size={40}
            strokeWidth={1.5}
            fill={(hovered || value) >= n ? '#267253' : 'none'}
            color={(hovered || value) >= n ? '#267253' : 'rgba(255,255,255,0.2)'}
          />
        </button>
      ))}
    </div>
  );
}

const LABELS = ['', 'Décevant', 'Peut mieux faire', 'Correct', 'Très bien', 'Excellent !'];
const LABEL_COLORS = ['', '#ef4444', '#f59e0b', '#6366f1', '#3b82f6', '#10b981'];

export default function ReviewPage() {
  const { token } = useParams();
  const [state, setState] = useState('loading'); // loading | form | submitted | error | already
  const [info, setInfo]   = useState(null);
  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg]     = useState('');

  useEffect(() => {
    api.get(`/reviews/${token}`)
      .then(({ data }) => { setInfo(data); setState('form'); })
      .catch(err => {
        if (err.response?.status === 409) { setState('already'); }
        else { setErrorMsg(err.response?.data?.error || 'Lien invalide.'); setState('error'); }
      });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      await api.post(`/reviews/${token}`, { rating, comment: comment.trim() || undefined });
      setState('submitted');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Erreur lors de l\'envoi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
       minHeight: '100vh',
       background: 'linear-gradient(135deg, #050508 0%, #111118 60%, #1a1a2e 100%)',
       display: 'flex', alignItems: 'center', justifyContent: 'center',
       padding: '24px 16px', fontFamily: 'system-ui, -apple-system, sans-serif',
     }}>
      <Seo
        title="Avis client | 3M Drive"
        description="Partagez votre avis sur votre course avec 3M Drive."
        canonicalPath={`/review/${token}`}
        noindex
      />
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 24, padding: '40px 36px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(38,114,83,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Car size={22} strokeWidth={1.5} color="#267253" />
            </div>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#267253', letterSpacing: '-0.5px' }}>3M Drive</span>
          </div>
        </div>

        {/* ── Chargement ── */}
        {state === 'loading' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <Loader2 size={32} className="animate-spin" color="#267253" />
          </div>
        )}

        {/* ── Erreur ── */}
        {state === 'error' && (
          <div style={{ textAlign: 'center' }}>
            <AlertTriangle size={40} color="#ef4444" style={{ marginBottom: 16 }} />
            <p style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>Lien invalide</p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.88rem' }}>{errorMsg}</p>
            <Link to="/" style={{ display: 'inline-block', marginTop: 20, color: '#267253', fontSize: '0.88rem' }}>
              Retour à l'accueil
            </Link>
          </div>
        )}

        {/* ── Déjà soumis ── */}
        {state === 'already' && (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle size={40} color="#10b981" style={{ marginBottom: 16 }} />
            <p style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem', marginBottom: 8 }}>Avis déjà enregistré</p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.88rem' }}>Vous avez déjà soumis un avis pour cette course. Merci !</p>
            <Link to="/" style={{ display: 'inline-block', marginTop: 20, color: '#267253', fontSize: '0.88rem' }}>
              Retour à l'accueil
            </Link>
          </div>
        )}

        {/* ── Succès ── */}
        {state === 'submitted' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: '1.2rem', marginBottom: 8 }}>Merci pour votre avis !</p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.88rem', lineHeight: 1.6 }}>
              Votre retour aide à améliorer la qualité du service.<br />À bientôt sur 3M Drive !
            </p>
            <StarRating value={rating} readonly />
            <Link to="/" style={{ display: 'inline-block', marginTop: 24, color: '#267253', fontSize: '0.88rem' }}>
              Retour à l'accueil
            </Link>
          </div>
        )}

        {/* ── Formulaire ── */}
        {state === 'form' && info && (
          <form onSubmit={handleSubmit}>
            {/* Infos course */}
            <div style={{
              background: 'rgba(38,114,83,0.06)',
              border: '1px solid rgba(38,114,83,0.18)',
              borderRadius: 14, padding: '16px 18px', marginBottom: 28,
            }}>
              <p style={{ color: '#267253', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 10px' }}>
                Votre course
              </p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                <Calendar size={13} color="rgba(255,255,255,0.4)" style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)' }}>
                  {new Date(info.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  {info.time ? ` à ${info.time}` : ''}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <MapPin size={13} color="rgba(255,255,255,0.4)" style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
                  {info.departure?.slice(0, 35)}… → {info.arrival?.slice(0, 35)}…
                </span>
              </div>
              <p style={{ margin: '10px 0 0', fontSize: '0.82rem', color: 'rgba(255,255,255,0.45)' }}>
                Chauffeur : <strong style={{ color: 'rgba(255,255,255,0.75)' }}>{info.driverName}</strong>
              </p>
            </div>

            {/* Question */}
            <p style={{ textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: '1.1rem', marginBottom: 6 }}>
              Comment s'est passée votre course ?
            </p>
            <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem', marginBottom: 20 }}>
              Bonjour {info.clientName?.split(' ')[0]}, votre avis est précieux.
            </p>

            {/* Étoiles */}
            <div style={{ marginBottom: 8 }}>
              <StarRating value={rating} onChange={setRating} />
            </div>
            {rating > 0 && (
              <p style={{ textAlign: 'center', fontSize: '0.88rem', fontWeight: 700, color: LABEL_COLORS[rating], marginBottom: 20, transition: 'color 0.2s' }}>
                {LABELS[rating]}
              </p>
            )}

            {/* Commentaire */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>
                Commentaire <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.25)' }}>(facultatif)</span>
              </label>
              <textarea
                placeholder="Partagez votre expérience…"
                rows={3}
                maxLength={1000}
                value={comment}
                onChange={e => setComment(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10, boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.8)', fontSize: '0.88rem', resize: 'vertical',
                  outline: 'none', fontFamily: 'inherit', lineHeight: 1.6,
                }}
              />
              {comment.length > 0 && (
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', textAlign: 'right', marginTop: 4 }}>
                  {comment.length}/1000
                </p>
              )}
            </div>

            {errorMsg && (
              <p style={{ color: '#ef4444', fontSize: '0.82rem', marginBottom: 12, textAlign: 'center' }}>{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={rating === 0 || submitting}
              style={{
                width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                background: rating > 0 ? '#267253' : 'rgba(255,255,255,0.08)',
                color: rating > 0 ? '#1a1a2e' : 'rgba(255,255,255,0.3)',
                fontWeight: 700, fontSize: '0.97rem', cursor: rating > 0 ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} strokeWidth={2} />}
              {submitting ? 'Envoi en cours…' : 'Envoyer mon avis'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
