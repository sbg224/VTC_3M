import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { reservationAPI, simulateAPI } from '../services/api';

// ── Widget de simulation ──────────────────────────────────────────────────────

function SimulationWidget({ onReserve }) {
  const [departure, setDeparture] = useState('');
  const [arrival, setArrival] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const canSimulate = departure.trim().length >= 3 && arrival.trim().length >= 3;

  const handleSimulate = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const { data } = await simulateAPI.calculate(departure.trim(), arrival.trim());
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Impossible de calculer l\'itinéraire. Vérifiez les adresses.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = (setter) => (e) => {
    setter(e.target.value);
    setResult(null);
    setError('');
  };

  return (
    <div className="simulation-card">
      <div className="simulation-header">
        <span className="simulation-icon">🧮</span>
        <div>
          <h2>Simuler le prix de votre trajet</h2>
          <p>Obtenez une estimation instantanée avant de réserver</p>
        </div>
      </div>

      <form onSubmit={handleSimulate} className="simulation-form">
        <div className="simulation-fields">
          <div className="form-group">
            <label className="form-label">🟢 Adresse de départ</label>
            <input
              type="text"
              className="form-control"
              value={departure}
              onChange={handleAddressChange(setDeparture)}
              placeholder="Ex : 12 Allée Jean Jaurès, Toulouse"
            />
          </div>
          <div className="simulation-arrow">→</div>
          <div className="form-group">
            <label className="form-label">🔴 Adresse d'arrivée</label>
            <input
              type="text"
              className="form-control"
              value={arrival}
              onChange={handleAddressChange(setArrival)}
              placeholder="Ex : Aéroport Toulouse-Blagnac"
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={!canSimulate || loading}
          style={{ minWidth: '180px' }}
        >
          {loading ? '⏳ Calcul en cours...' : '🧮 Estimer le prix'}
        </button>
      </form>

      {error && (
        <div className="alert alert-error" style={{ marginTop: '16px' }}>
          ⚠️ {error}
        </div>
      )}

      {result && (
        <div className="simulation-result">
          <div className="simulation-result-grid">
            <div className="sim-stat">
              <span className="sim-stat-icon">📍</span>
              <div>
                <div className="sim-stat-value">{result.distance_km} km</div>
                <div className="sim-stat-label">Distance</div>
              </div>
            </div>
            <div className="sim-stat">
              <span className="sim-stat-icon">⏱</span>
              <div>
                <div className="sim-stat-value">~{result.duration_min} min</div>
                <div className="sim-stat-label">Durée estimée</div>
              </div>
            </div>
            <div className="sim-stat sim-stat-price">
              <span className="sim-stat-icon">💰</span>
              <div>
                <div className="sim-stat-value">{Number(result.estimatedPrice).toFixed(2)} €</div>
                <div className="sim-stat-label">Prix estimé TTC</div>
              </div>
            </div>
          </div>
          <div className="simulation-breakdown">
            {result.breakdown.baseFee > 0 && (
              <span>Frais fixes : {Number(result.breakdown.baseFee).toFixed(2)} €</span>
            )}
            <span>
              {result.distance_km} km × {result.breakdown.pricePerKm} €/km
              = {Number(result.breakdown.distanceCharge).toFixed(2)} €
            </span>
            {result.breakdown.distanceCharge < result.breakdown.minimumPrice && (
              <span>Prix minimum appliqué : {Number(result.breakdown.minimumPrice).toFixed(2)} €</span>
            )}
          </div>
          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '16px' }}
            onClick={() => onReserve({ departure, arrival, result })}
          >
            🚗 Réserver ce trajet →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Formulaire de réservation ─────────────────────────────────────────────────

const emptyForm = {
  firstName: '', lastName: '', email: '', phone: '',
  departureAddress: '', arrivalAddress: '',
  date: '', time: '', passengers: '1', luggage: '0',
  comments: '', gdprConsent: false,
};

function validate(form) {
  const errors = {};
  if (!form.firstName.trim()) errors.firstName = 'Le prénom est requis.';
  if (!form.lastName.trim()) errors.lastName = 'Le nom est requis.';
  if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Email invalide.';
  if (!form.phone.trim() || !/^(\+33|0)[1-9](\d{8})$/.test(form.phone.replace(/\s/g, ''))) {
    errors.phone = 'Numéro de téléphone invalide (format français).';
  }
  if (!form.departureAddress.trim()) errors.departureAddress = 'L\'adresse de départ est requise.';
  if (!form.arrivalAddress.trim()) errors.arrivalAddress = 'L\'adresse d\'arrivée est requise.';
  if (!form.date) {
    errors.date = 'La date est requise.';
  } else {
    const selected = new Date(form.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selected < today) errors.date = 'La date doit être dans le futur.';
  }
  if (!form.time) errors.time = 'L\'heure est requise.';
  if (!form.gdprConsent) errors.gdprConsent = 'Vous devez accepter la politique de confidentialité.';
  return errors;
}

function FormField({ label, required, error, children }) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}{required && <span>*</span>}
      </label>
      {children}
      {error && <div className="form-error">⚠ {error}</div>}
    </div>
  );
}

export default function Reservation() {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [serverError, setServerError] = useState('');
  const [simData, setSimData] = useState(null); // { distance_km, estimatedPrice }

  const formRef = useRef(null);
  const today = new Date().toISOString().split('T')[0];

  const handleSimReserve = ({ departure, arrival, result }) => {
    setForm(prev => ({ ...prev, departureAddress: departure, arrivalAddress: arrival }));
    setSimData({ distance_km: result.distance_km, estimatedPrice: result.estimatedPrice });
    setErrors({});
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if ((name === 'departureAddress' || name === 'arrivalAddress') && simData) {
      setSimData(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      document.querySelector('.form-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        ...(simData && {
          distance:       simData.distance_km,
          estimatedPrice: simData.estimatedPrice,
        }),
      };
      const { data } = await reservationAPI.create(payload);
      setSuccess({ ...data, simData });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setServerError(err.response?.data?.error || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // ── Succès ───────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <section className="reservation-page">
        <div className="container">
          <div className="success-card">
            <div className="success-icon">✅</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', marginBottom: '8px' }}>
              Réservation confirmée !
            </h2>
            <div className="success-number">{success.reservation?.reservationNumber}</div>
            {success.simData && (
              <div style={{
                background: '#ecfdf5', border: '1px solid #bbf7d0',
                borderRadius: 'var(--radius)', padding: '12px 24px',
                margin: '16px auto', display: 'inline-block',
              }}>
                <span style={{ fontSize: '1.15rem', fontWeight: '700', color: '#065f46' }}>
                  💰 {Number(success.simData.estimatedPrice).toFixed(2)} € – {success.simData.distance_km} km
                </span>
              </div>
            )}
            <p className="success-desc">
              Votre réservation a bien été enregistrée. Vous recevrez une confirmation
              par email avec votre bon de réservation. Notre chauffeur vous contactera
              pour confirmer votre prise en charge.
            </p>
            {success.reservation?.pdfUrl && (
              <a href={success.reservation.pdfUrl} download className="btn btn-primary" style={{ marginBottom: '16px' }}>
                📄 Télécharger mon bon de réservation
              </a>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '16px' }}>
              <button
                className="btn btn-outline"
                style={{ color: 'var(--color-primary)', borderColor: 'var(--color-gray-light)' }}
                onClick={() => { setSuccess(null); setForm(emptyForm); setSimData(null); }}
              >
                Nouvelle réservation
              </button>
              <Link to="/" className="btn btn-dark">Retour à l'accueil</Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── Page principale ──────────────────────────────────────────────────────────
  return (
    <section className="reservation-page">
      <div className="container">
        <div className="reservation-page-header">
          <h1 className="section-title">
            Réserver une <span className="gold-accent">course</span>
          </h1>
          <p className="section-subtitle">
            Simulez le prix de votre trajet, puis réservez en quelques secondes.
          </p>
        </div>

        {/* Widget de simulation */}
        <SimulationWidget onReserve={handleSimReserve} />

        {/* Formulaire */}
        <div className="reservation-form-card" ref={formRef} style={{ marginTop: '32px' }}>
          <div className="reservation-form-header">
            <h2>📋 Formulaire de réservation</h2>
            <p>Tous les champs marqués d'un * sont obligatoires</p>
          </div>

          <form onSubmit={handleSubmit} className="reservation-form-body" noValidate>
            {serverError && <div className="alert alert-error">⚠️ {serverError}</div>}

            <div className="form-section-title">👤 Informations personnelles</div>
            <div className="form-row">
              <FormField label="Prénom" required error={errors.firstName}>
                <input
                  type="text" name="firstName"
                  className={`form-control ${errors.firstName ? 'error' : ''}`}
                  value={form.firstName} onChange={handleChange}
                  placeholder="Jean" autoComplete="given-name"
                />
              </FormField>
              <FormField label="Nom" required error={errors.lastName}>
                <input
                  type="text" name="lastName"
                  className={`form-control ${errors.lastName ? 'error' : ''}`}
                  value={form.lastName} onChange={handleChange}
                  placeholder="Dupont" autoComplete="family-name"
                />
              </FormField>
            </div>
            <div className="form-row">
              <FormField label="Email" required error={errors.email}>
                <input
                  type="email" name="email"
                  className={`form-control ${errors.email ? 'error' : ''}`}
                  value={form.email} onChange={handleChange}
                  placeholder="jean.dupont@email.fr" autoComplete="email"
                />
              </FormField>
              <FormField label="Téléphone" required error={errors.phone}>
                <input
                  type="tel" name="phone"
                  className={`form-control ${errors.phone ? 'error' : ''}`}
                  value={form.phone} onChange={handleChange}
                  placeholder="+33 6 12 34 56 78" autoComplete="tel"
                />
              </FormField>
            </div>

            <div className="form-section-title" style={{ marginTop: '24px' }}>🗺️ Détails de la course</div>
            <FormField label="Adresse de départ" required error={errors.departureAddress}>
              <input
                type="text" name="departureAddress"
                className={`form-control ${errors.departureAddress ? 'error' : ''}`}
                value={form.departureAddress} onChange={handleChange}
                placeholder="Ex : Gare Matabiau, Toulouse"
              />
            </FormField>
            <FormField label="Adresse d'arrivée" required error={errors.arrivalAddress}>
              <input
                type="text" name="arrivalAddress"
                className={`form-control ${errors.arrivalAddress ? 'error' : ''}`}
                value={form.arrivalAddress} onChange={handleChange}
                placeholder="Ex : Aéroport Toulouse-Blagnac, Terminal A"
              />
            </FormField>

            {/* Bandeau prix verrouillé */}
            {simData && (
              <div className="price-locked-banner">
                <div className="price-locked-info">
                  <span className="price-locked-badge">🔒 Prix calculé</span>
                  <div className="price-locked-details">
                    <span className="price-locked-amount">
                      {Number(simData.estimatedPrice).toFixed(2)} ���
                    </span>
                    <span className="price-locked-meta">
                      pour {simData.distance_km} km
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="price-locked-reset"
                  onClick={() => setSimData(null)}
                  title="Effacer le prix estimé"
                >
                  ✕ Recalculer
                </button>
              </div>
            )}

            <div className="form-row">
              <FormField label="Date de prise en charge" required error={errors.date}>
                <input
                  type="date" name="date"
                  className={`form-control ${errors.date ? 'error' : ''}`}
                  value={form.date} onChange={handleChange} min={today}
                />
              </FormField>
              <FormField label="Heure de prise en charge" required error={errors.time}>
                <input
                  type="time" name="time"
                  className={`form-control ${errors.time ? 'error' : ''}`}
                  value={form.time} onChange={handleChange}
                />
              </FormField>
            </div>

            <div className="form-row">
              <FormField label="Nombre de passagers">
                <select name="passengers" className="form-control" value={form.passengers} onChange={handleChange}>
                  {[1,2,3,4,5,6,7].map(n => (
                    <option key={n} value={n}>{n} passager{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Nombre de bagages">
                <select name="luggage" className="form-control" value={form.luggage} onChange={handleChange}>
                  {[0,1,2,3,4,5,6].map(n => (
                    <option key={n} value={n}>{n} bagage{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </FormField>
            </div>

            <FormField label="Commentaires / Instructions particulières" error={errors.comments}>
              <textarea
                name="comments" className="form-control"
                value={form.comments} onChange={handleChange}
                rows="3"
                placeholder="Vol n°, besoin particulier, numéro de quai, etc."
                style={{ resize: 'vertical', minHeight: '80px' }}
              />
            </FormField>

            <div className="form-check">
              <input
                type="checkbox" id="gdprConsent" name="gdprConsent"
                checked={form.gdprConsent} onChange={handleChange}
              />
              <label htmlFor="gdprConsent">
                J'accepte que mes données personnelles soient utilisées pour le traitement de ma réservation,
                conformément à la{' '}
                <a href="#" style={{ color: 'var(--color-accent)' }}>politique de confidentialité</a>.
                Ces données ne seront pas partagées avec des tiers. <strong>*</strong>
              </label>
            </div>
            {errors.gdprConsent && (
              <div className="form-error" style={{ marginLeft: '28px' }}>⚠ {errors.gdprConsent}</div>
            )}

            <div style={{ marginTop: '32px' }}>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                disabled={loading}
              >
                {loading ? '⏳ Envoi en cours...' : '🚗 Confirmer ma réservation'}
              </button>
            </div>

            <div style={{
              marginTop: '16px', padding: '16px',
              background: 'var(--color-light)', borderRadius: 'var(--radius)',
              display: 'flex', gap: '12px', alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: '1.2rem' }}>🔒</span>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-gray)' }}>
                Vos données sont sécurisées et chiffrées. Un bon de réservation vous sera envoyé
                par email immédiatement après validation.
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
