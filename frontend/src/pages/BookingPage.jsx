import { useState, useRef, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Calculator, Loader2, AlertTriangle, MapPin, Clock, Euro, Car,
  CheckCircle, FileText, ClipboardList, User, Lock, Star, Shield,
} from 'lucide-react';
import { reservationAPI, simulateAPI, driverPublicAPI } from '../services/api';
import Seo from '../components/Seo';

// ── Widget simulation (identique à Reservation.jsx) ──────────────────────────

function SimulationWidget({ onReserve }) {
  const [departure, setDeparture] = useState('');
  const [arrival,   setArrival]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState('');

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
        <span className="simulation-icon"><Calculator size={24} strokeWidth={1.5} /></span>
        <div>
          <h2>Simuler le prix de votre trajet</h2>
          <p>Obtenez une estimation instantanée avant de réserver</p>
        </div>
      </div>

      <form onSubmit={handleSimulate} className="simulation-form">
        <div className="simulation-fields">
          <div className="form-group">
            <label className="form-label flex items-center gap-1">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block' }}></span>
              Adresse de départ
            </label>
            <input
              type="text" className="form-control" value={departure}
              onChange={handleAddressChange(setDeparture)}
              placeholder="Ex : 12 Allée Jean Jaurès, Toulouse"
            />
          </div>
          <div className="simulation-arrow">→</div>
          <div className="form-group">
            <label className="form-label flex items-center gap-1">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-error)', display: 'inline-block' }}></span>
              Adresse d'arrivée
            </label>
            <input
              type="text" className="form-control" value={arrival}
              onChange={handleAddressChange(setArrival)}
              placeholder="Ex : Aéroport Toulouse-Blagnac"
            />
          </div>
        </div>

        {error && (
          <div className="alert alert-error flex items-center gap-2">
            <AlertTriangle size={14} strokeWidth={1.5} /> {error}
          </div>
        )}

        <button
          type="submit" className="btn btn-primary btn-lg"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          disabled={!canSimulate || loading}
        >
          {loading
            ? <><Loader2 size={15} className="animate-spin" /> Calcul en cours...</>
            : <><Calculator size={15} strokeWidth={1.5} /> Estimer le prix</>}
        </button>
      </form>

      {result && (
        <div className="simulation-result">
          <div className="sim-stats">
            <div className="sim-stat">
              <span className="sim-stat-icon"><MapPin size={18} strokeWidth={1.5} /></span>
              <div>
                <div className="sim-stat-value">{result.distance_km} km</div>
                <div className="sim-stat-label">Distance estimée</div>
              </div>
            </div>
            <div className="sim-stat">
              <span className="sim-stat-icon"><Clock size={18} strokeWidth={1.5} /></span>
              <div>
                <div className="sim-stat-value">~{result.duration_min} min</div>
                <div className="sim-stat-label">Durée estimée</div>
              </div>
            </div>
            <div className="sim-stat sim-stat-price">
              <span className="sim-stat-icon"><Euro size={18} strokeWidth={1.5} /></span>
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
            <Car size={15} strokeWidth={1.5} /> Réserver ce trajet →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Validation ────────────────────────────────────────────────────────────────

const emptyForm = {
  firstName: '', lastName: '', email: '', phone: '',
  departureAddress: '', arrivalAddress: '',
  date: '', time: '', passengers: '1', luggage: '0',
  comments: '', gdprConsent: false, termsAccepted: false,
};

function validate(form) {
  const errors = {};
  if (!form.firstName.trim()) errors.firstName = 'Le prénom est requis.';
  if (!form.lastName.trim())  errors.lastName  = 'Le nom est requis.';
  if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Email invalide.';
  if (!form.phone.trim() || !/^(\+33|0)[1-9](\d{8})$/.test(form.phone.replace(/\s/g, ''))) {
    errors.phone = 'Numéro de téléphone invalide (format français).';
  }
  if (!form.departureAddress.trim()) errors.departureAddress = 'L\'adresse de départ est requise.';
  if (!form.arrivalAddress.trim())   errors.arrivalAddress   = 'L\'adresse d\'arrivée est requise.';
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
  if (!form.termsAccepted) errors.termsAccepted = 'Vous devez accepter les CGU.';
  return errors;
}

function FormField({ label, required, error, children }) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}{required && <span>*</span>}
      </label>
      {children}
      {error && <div className="form-error flex items-center gap-1"><AlertTriangle size={12} strokeWidth={1.5} /> {error}</div>}
    </div>
  );
}

// ── BookingPage ───────────────────────────────────────────────────────────────

export default function BookingPage() {
  const { slug } = useParams();

  // État chauffeur
  const [driver,       setDriver]       = useState(null);
  const [driverLoading, setDriverLoading] = useState(true);
  const [driverError,  setDriverError]  = useState('');

  // État formulaire
  const [form,        setForm]        = useState(emptyForm);
  const [errors,      setErrors]      = useState({});
  const [loading,     setLoading]     = useState(false);
  const [success,     setSuccess]     = useState(null);
  const [serverError, setServerError] = useState('');
  const [simData,     setSimData]     = useState(null);

  const formRef = useRef(null);
  const today = new Date().toISOString().split('T')[0];

  // ── Chargement du profil chauffeur ─────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;
    setDriverLoading(true);
    driverPublicAPI.getBySlug(slug)
      .then(({ data }) => setDriver(data.driver))
      .catch(() => setDriverError('Ce lien de réservation est invalide ou le chauffeur est inactif.'))
      .finally(() => setDriverLoading(false));
  }, [slug]);

  // ── Handlers ───────────────────────────────────────────────────────────────
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
        driverSlug: slug,                // rattache la réservation à CE chauffeur
        ...(simData && {
          distance:       simData.distance_km,
          estimatedPrice: simData.estimatedPrice,
        }),
      };
      const { data } = await reservationAPI.create(payload);
      setSuccess({ ...data, simData });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const backendFields = err.response?.data?.fields;
      if (backendFields) {
        setErrors(prev => ({ ...prev, ...backendFields }));
        document.querySelector('.form-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setServerError(err.response?.data?.error || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const seo = (
    <Seo
      title={`${driver?.businessName || driver?.name || 'Chauffeur VTC Toulouse'} | Réservation en ligne 3M Drive`}
      description={`Réservez votre trajet avec ${driver?.businessName || driver?.name || 'un chauffeur partenaire'} sur 3M Drive, estimation rapide et réservation VTC à Toulouse.`}
      canonicalPath={`/book/${slug}`}
    />
  );

  // ── États de chargement / erreur du profil ─────────────────────────────────
  if (driverLoading) {
    return (
      <section className="reservation-page">
        <div className="container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loader"></div>
        </div>
      </section>
    );
  }

  if (driverError || !driver) {
    return (
      <section className="reservation-page">
        <div className="container">
          <div className="success-card" style={{ textAlign: 'center', maxWidth: '480px', margin: '80px auto' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>
              <AlertTriangle size={48} strokeWidth={1.5} style={{ color: 'var(--color-error)', margin: '0 auto' }} />
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', marginBottom: '12px' }}>
              Lien invalide
            </h2>
            <p style={{ color: 'var(--color-gray)', marginBottom: '24px' }}>
              {driverError || 'Ce lien de réservation n\'est pas valide ou a expiré.'}
            </p>
            <Link to="/" className="btn btn-primary">Retour à l'accueil</Link>
          </div>
        </div>
      </section>
    );
  }

  // ── Succès ─────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <section className="reservation-page">
        {seo}
        <div className="container">
          <div className="success-card">
            <div className="success-icon"><CheckCircle size={48} strokeWidth={1.5} style={{ color: 'var(--color-success)', margin: '0 auto' }} /></div>
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
                <span style={{ fontSize: '1.15rem', fontWeight: '700', color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Euro size={16} strokeWidth={1.5} />
                  {Number(success.simData.estimatedPrice).toFixed(2)} € – {success.simData.distance_km} km
                </span>
              </div>
            )}
            <p className="success-desc">
              Votre réservation auprès de <strong>{driver.businessName || driver.name}</strong> a bien été enregistrée.
              Vous recevrez une confirmation par email avec votre bon de réservation.
              Votre chauffeur vous contactera pour confirmer votre prise en charge.
            </p>
            {success.reservation?.pdfUrl && (
              <a href={success.reservation.pdfUrl} download
                className="btn btn-primary flex items-center gap-2"
                style={{ marginBottom: '16px', display: 'inline-flex' }}>
                <FileText size={15} strokeWidth={1.5} /> Télécharger mon bon de réservation
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

  // ── Page principale ────────────────────────────────────────────────────────
  return (
    <section className="reservation-page">
      {seo}
      <div className="container">

        {/* Bandeau identité chauffeur */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '14px', marginBottom: '40px',
          padding: '18px 28px',
          background: 'rgba(212,175,55,0.07)',
          border: '1px solid rgba(212,175,55,0.25)',
          borderRadius: '16px',
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Car size={20} strokeWidth={1.5} style={{ color: 'var(--color-accent)' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
              Vous réservez avec
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: '700', fontSize: '1.1rem', color: 'var(--color-white)' }}>
              {driver.businessName || driver.name}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
            <Star size={12} strokeWidth={1.5} style={{ color: 'var(--color-accent)' }} />
            Chauffeur VTC certifié
          </div>
        </div>

        {/* En-tête page */}
        <div className="reservation-page-header">
          <p className="section-label" style={{ justifyContent: 'center' }}>Réservation en ligne</p>
          <h1 className="section-title">
            Réserver une <span className="gold-accent">course</span>
          </h1>
          <p className="section-subtitle" style={{ margin: '0 auto var(--space-8)' }}>
            Simulez le prix de votre trajet, puis réservez en quelques secondes.
          </p>
        </div>

        {/* Widget simulation */}
        <SimulationWidget onReserve={handleSimReserve} />

        {/* Formulaire */}
        <div className="reservation-form-card" ref={formRef} style={{ marginTop: '32px' }}>
          <div className="reservation-form-header">
            <h2 className="flex items-center gap-2"><ClipboardList size={20} strokeWidth={1.5} /> Formulaire de réservation</h2>
            <p>Tous les champs marqués d'un * sont obligatoires</p>
          </div>

          <form onSubmit={handleSubmit} className="reservation-form-body" noValidate>
            {serverError && (
              <div className="alert alert-error flex items-center gap-2">
                <AlertTriangle size={14} strokeWidth={1.5} /> {serverError}
              </div>
            )}

            <div className="form-section-title flex items-center gap-2">
              <User size={14} strokeWidth={1.5} /> Informations personnelles
            </div>
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

            <div className="form-section-title flex items-center gap-2" style={{ marginTop: '24px' }}>
              <MapPin size={14} strokeWidth={1.5} /> Détails de la course
            </div>
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
                  <span className="price-locked-badge flex items-center gap-1">
                    <Lock size={12} strokeWidth={1.5} /> Prix calculé
                  </span>
                  <div className="price-locked-details">
                    <span className="price-locked-amount">
                      {Number(simData.estimatedPrice).toFixed(2)} €
                    </span>
                    <span className="price-locked-meta">
                      pour {simData.distance_km} km
                    </span>
                  </div>
                </div>
                <button
                  type="button" className="price-locked-reset"
                  onClick={() => setSimData(null)} title="Effacer le prix estimé"
                >
                  × Recalculer
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
                <Link to="/politique-rgpd" style={{ color: 'var(--color-accent)' }}>
                  politique de confidentialité
                </Link>.
                Ces données ne seront pas partagées avec des tiers. <strong>*</strong>
              </label>
            </div>
            {errors.gdprConsent && (
              <div className="form-error flex items-center gap-1" style={{ marginLeft: '28px' }}>
                <AlertTriangle size={12} strokeWidth={1.5} /> {errors.gdprConsent}
              </div>
            )}

            <div className="form-check">
              <input
                type="checkbox" id="termsAccepted" name="termsAccepted"
                checked={form.termsAccepted} onChange={handleChange}
              />
              <label htmlFor="termsAccepted">
                J'ai lu et j'accepte les{' '}
                <Link to="/cgu" style={{ color: 'var(--color-accent)' }}>
                  conditions générales d'utilisation
                </Link>. <strong>*</strong>
              </label>
            </div>
            {errors.termsAccepted && (
              <div className="form-error flex items-center gap-1" style={{ marginLeft: '28px' }}>
                <AlertTriangle size={12} strokeWidth={1.5} /> {errors.termsAccepted}
              </div>
            )}

            <div style={{ marginTop: '32px' }}>
              <button
                type="submit" className="btn btn-primary btn-lg"
                style={{ width: '100%' }} disabled={loading}
              >
                {loading
                  ? <><Loader2 size={15} className="animate-spin" /> Envoi en cours...</>
                  : <><Car size={15} strokeWidth={1.5} /> Confirmer ma réservation</>}
              </button>
            </div>

            <div style={{
              marginTop: '16px', padding: '16px',
              background: 'var(--color-light)', borderRadius: 'var(--radius)',
              display: 'flex', gap: '12px', alignItems: 'flex-start',
            }}>
              <Shield size={18} strokeWidth={1.5} style={{ flexShrink: 0, color: 'var(--color-accent)' }} />
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
