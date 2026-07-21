import { useState, useRef, useEffect, isValidElement, cloneElement } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Calculator, Loader2, AlertTriangle, MapPin, Clock, Euro, Car,
  CheckCircle, ClipboardList, User, Lock, ArrowRight,
  Phone, Mail, Users, Briefcase, MessageSquare, Navigation,
  Timer, ShieldCheck, Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { simulateAPI } from '../services/api';
import Seo from '../components/Seo';
import { emptyReservationForm } from '../utils/reservationForm';
import useReservationForm from '../hooks/useReservationForm';

// ── Constantes ────────────────────────────────────────────────────────────────
const DURATIONS = ['1h','2h','3h','4h','5h','6h','8h','10h','12h'];

// ── Animations ────────────────────────────────────────────────────────────────
const fadeSlide = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

// ── Composant champ de formulaire ─────────────────────────────────────────────
function Field({ id, label, required, error, icon: Icon, children }) {
  return (
    <div className="resv-field">
      <label className="resv-label" htmlFor={id}>
        {Icon && <Icon size={13} strokeWidth={1.75} />}
        {label}{required && <span className="resv-required">*</span>}
      </label>
      <div className={`resv-input-wrap ${error ? 'has-error' : ''}`}>
        {isValidElement(children) ? cloneElement(children, { id }) : children}
      </div>
      <AnimatePresence>
        {error && (
          <motion.div className="resv-error" {...fadeSlide} key="err">
            <AlertTriangle size={11} strokeWidth={2} /> {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Widget simulation Transfert ───────────────────────────────────────────────
function SimWidget({ departure, arrival, onResult, simData, onClear }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const canSim = departure.trim().length >= 3 && arrival.trim().length >= 3;

  const handleSim = async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await simulateAPI.calculate(departure.trim(), arrival.trim());
      onResult(data);
    } catch {
      setError('Impossible de calculer l\'itinéraire. Vérifiez les adresses saisies.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resv-sim-area">
      {error && (
        <div className="resv-alert-error">
          <AlertTriangle size={13} strokeWidth={1.75} /> {error}
        </div>
      )}

      {!simData ? (
        <button
          type="button"
          className="resv-sim-btn"
          disabled={!canSim || loading}
          onClick={handleSim}
        >
          {loading
            ? <><Loader2 size={14} className="animate-spin" /> Calcul en cours…</>
            : <><Calculator size={14} strokeWidth={1.75} /> Estimer le prix du trajet</>
          }
        </button>
      ) : (
        <motion.div className="resv-price-banner" {...fadeSlide}>
          <div className="resv-price-inner">
            <div className="resv-price-badge">
              <Zap size={12} strokeWidth={2} /> Prix fixe calculé
            </div>
            <div className="resv-price-value">
              {Number(simData.estimatedPrice).toFixed(2)} €
            </div>
            <div className="resv-price-meta">
              {simData.distance_km} km · ~{simData.duration_min} min · TTC
            </div>
          </div>
          <button type="button" className="resv-price-reset" onClick={onClear}>
            Recalculer
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ── Formulaire principal ──────────────────────────────────────────────────────
export default function Reservation() {
  const location = useLocation();
  const formRef  = useRef(null);
  const today    = new Date().toISOString().split('T')[0];

  const [serviceType, setServiceType] = useState('transfert');
  const [duration,    setDuration]    = useState('2h');
  const [success,     setSuccess]     = useState(null);
  const {
    form, setForm, errors, setErrors, loading, serverError,
    simData, setSimData, handleChange, handleSubmit,
  } = useReservationForm({
    validateOptions: { requireArrival: serviceType === 'transfert' },
    errorSelector: '.has-error',
    buildPayload: ({ form: reservationForm, simData: simulation }) => {
      const serviceNote = serviceType === 'mise_a_disposition'
        ? `[Mise à disposition – ${duration}] `
        : '[Transfert] ';
      return {
        ...reservationForm,
        arrivalAddress: serviceType === 'mise_a_disposition'
          ? `Mise à disposition – ${duration}`
          : reservationForm.arrivalAddress,
        comments: serviceNote + (reservationForm.comments || ''),
        ...(simulation && {
          distance: simulation.distance_km,
          estimatedPrice: simulation.estimatedPrice,
        }),
      };
    },
    onSuccess: ({ data, simData: simulation }) => {
      setSuccess({ ...data, simData: simulation, serviceType, duration });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
  });

  // Pré-remplissage depuis le formulaire héro
  useEffect(() => {
    const state = location.state;
    if (!state) return;
    if (state.departure || state.arrival) {
      setForm(prev => ({
        ...prev,
        departureAddress: state.departure || '',
        arrivalAddress:   state.arrival   || '',
      }));
    }
    if (state.tab === 'mise_a_disposition') setServiceType('mise_a_disposition');
    if (state.duration) setDuration(state.duration);
    if (state.simData)  setSimData(state.simData);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
  }, []); // eslint-disable-line

  // Réinitialise l'estimation si les adresses changent
  useEffect(() => { setSimData(null); }, [form.departureAddress, form.arrivalAddress]);

  // Réinitialise le champ arrivée si on passe en mise à disposition
  useEffect(() => {
    if (serviceType === 'mise_a_disposition') {
      setForm(prev => ({ ...prev, arrivalAddress: '' }));
      setSimData(null);
      setErrors(prev => ({ ...prev, arrivalAddress: '' }));
    }
  }, [serviceType]);


  const seo = (
    <Seo
      title="Réservation VTC Toulouse, devis et réservation en ligne | 3M Drive"
      description="Réservez votre chauffeur VTC à Toulouse en ligne, obtenez un tarif estimé pour vos transferts aéroport, gare ou mise à disposition avec 3M Drive."
      canonicalPath="/reservation"
    />
  );

  // ── Écran succès ─────────────────────────────────────────────────────────────
  if (success) {
    return (
      <section className="resv-page">
        {seo}
        <div className="container">
          <motion.div className="resv-success" {...fadeSlide}>
            <div className="resv-success-icon">
              <CheckCircle size={52} strokeWidth={1.25} />
            </div>
            <h2 className="resv-success-title">Réservation confirmée !</h2>
            <div className="resv-success-number">
              {success.reservation?.reservationNumber}
            </div>

            {success.simData && (
              <div className="resv-success-price">
                <Euro size={15} strokeWidth={1.75} />
                {Number(success.simData.estimatedPrice).toFixed(2)} € · {success.simData.distance_km} km
              </div>
            )}
            {success.serviceType === 'mise_a_disposition' && (
              <div className="resv-success-price">
                <Timer size={15} strokeWidth={1.75} />
                Mise à disposition · {success.duration}
              </div>
            )}

            <p className="resv-success-desc">
              Votre bon de réservation vous a été envoyé par email.
              Notre chauffeur vous contactera pour confirmer la prise en charge.
            </p>

            <div className="resv-success-actions">
              <button
                className="btn btn-ghost"
                onClick={() => { setSuccess(null); setForm(emptyReservationForm); setSimData(null); }}
              >
                Nouvelle réservation
              </button>
              <Link to="/" className="btn btn-dark">Retour à l'accueil</Link>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  // ── Page principale ──────────────────────────────────────────────────────────
  return (
    <section className="resv-page">
      {seo}
      <div className="container">

        {/* En-tête */}
        <div className="resv-header">
          <p className="section-label" style={{ justifyContent: 'center' }}>Réservation en ligne</p>
          <h1 className="section-title" style={{ textAlign: 'center' }}>
            Réserver votre <span className="gold-accent">course</span>
          </h1>
          <p className="section-subtitle" style={{ textAlign: 'center', margin: '0 auto' }}>
            Transfert ponctuel ou mise à disposition — réservez en quelques secondes.
          </p>
        </div>

        {/* Sélecteur de service */}
        <div className="resv-type-selector">
          <button
            type="button"
            className={`resv-type-btn ${serviceType === 'transfert' ? 'active' : ''}`}
            onClick={() => setServiceType('transfert')}
          >
            <Navigation size={18} strokeWidth={1.5} />
            <span>
              <strong>Transfert</strong>
              <small>D'un point A à un point B</small>
            </span>
          </button>
          <button
            type="button"
            className={`resv-type-btn ${serviceType === 'mise_a_disposition' ? 'active' : ''}`}
            onClick={() => setServiceType('mise_a_disposition')}
          >
            <Timer size={18} strokeWidth={1.5} />
            <span>
              <strong>Mise à disposition</strong>
              <small>Chauffeur à la durée</small>
            </span>
          </button>
        </div>

        {/* Formulaire */}
        <div className="resv-form-card" ref={formRef}>

          <form onSubmit={handleSubmit} noValidate>

            {serverError && (
              <div className="resv-server-error">
                <AlertTriangle size={14} strokeWidth={1.75} /> {serverError}
              </div>
            )}

            {/* ── Section 1 : Itinéraire ──────────────────────────────────────── */}
            <div className="resv-section">
              <div className="resv-section-head">
                <div className="resv-section-icon"><Navigation size={16} strokeWidth={1.75} /></div>
                <div>
                  <h2>Itinéraire</h2>
                  <p>
                    {serviceType === 'transfert'
                      ? 'Renseignez votre point de départ et d\'arrivée'
                      : 'Renseignez votre point de départ et la durée souhaitée'}
                  </p>
                </div>
              </div>

              <div className="resv-fields">
                <Field id="departureAddress" label="Adresse de départ" required error={errors.departureAddress} icon={MapPin}>
                  <input
                    type="text" name="departureAddress"
                    className="resv-input"
                    value={form.departureAddress} onChange={handleChange}
                    placeholder="Ex : Gare Matabiau, Toulouse"
                  />
                </Field>

                <AnimatePresence mode="wait">
                  {serviceType === 'transfert' ? (
                    <motion.div key="arrival" {...fadeSlide}>
                      <Field id="arrivalAddress" label="Adresse d'arrivée" required error={errors.arrivalAddress} icon={MapPin}>
                        <input
                          type="text" name="arrivalAddress"
                          className="resv-input"
                          value={form.arrivalAddress} onChange={handleChange}
                          placeholder="Ex : Aéroport Toulouse-Blagnac, Terminal A"
                        />
                      </Field>
                    </motion.div>
                  ) : (
                    <motion.div key="duration" {...fadeSlide}>
                      <Field id="duration" label="Durée de mise à disposition" required icon={Timer}>
                        <select
                          className="resv-input resv-select"
                          value={duration}
                          onChange={e => setDuration(e.target.value)}
                        >
                          {DURATIONS.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </Field>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Simulation (Transfert uniquement) */}
                <AnimatePresence>
                  {serviceType === 'transfert' && (
                    <motion.div key="sim" {...fadeSlide}>
                      <SimWidget
                        departure={form.departureAddress}
                        arrival={form.arrivalAddress}
                        simData={simData}
                        onResult={setSimData}
                        onClear={() => setSimData(null)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Info mise à disposition */}
                <AnimatePresence>
                  {serviceType === 'mise_a_disposition' && (
                    <motion.div key="mada-info" {...fadeSlide} className="resv-mada-info">
                      <Timer size={14} strokeWidth={1.75} />
                      Le prix final sera établi selon la durée réelle et le kilométrage parcouru.
                      Un devis vous sera confirmé avant la course.
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Section 2 : Date & Passagers ───────────────────────────────── */}
            <div className="resv-section">
              <div className="resv-section-head">
                <div className="resv-section-icon"><Clock size={16} strokeWidth={1.75} /></div>
                <div>
                  <h2>Date &amp; Passagers</h2>
                  <p>Quand souhaitez-vous être pris en charge ?</p>
                </div>
              </div>

              <div className="resv-fields">
                <div className="resv-row">
                  <Field id="date" label="Date de prise en charge" required error={errors.date} icon={Clock}>
                    <input
                      type="date" name="date"
                      className="resv-input"
                      value={form.date} onChange={handleChange} min={today}
                    />
                  </Field>
                  <Field id="time" label="Heure de prise en charge" required error={errors.time} icon={Clock}>
                    <input
                      type="time" name="time"
                      className="resv-input"
                      value={form.time} onChange={handleChange}
                    />
                  </Field>
                </div>

                <div className="resv-row">
                  <Field id="passengers" label="Passagers" icon={Users}>
                    <select name="passengers" className="resv-input resv-select" value={form.passengers} onChange={handleChange}>
                      {[1,2,3,4,5,6,7].map(n => (
                        <option key={n} value={n}>{n} passager{n > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </Field>
                  <Field id="luggage" label="Bagages" icon={Briefcase}>
                    <select name="luggage" className="resv-input resv-select" value={form.luggage} onChange={handleChange}>
                      {[0,1,2,3,4,5,6].map(n => (
                        <option key={n} value={n}>{n} bagage{n > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field id="comments" label="Instructions particulières" icon={MessageSquare}>
                  <textarea
                    name="comments"
                    className="resv-input resv-textarea"
                    value={form.comments} onChange={handleChange}
                    rows="3"
                    placeholder="Numéro de vol, besoin particulier, panneau d'accueil, etc."
                  />
                </Field>
              </div>
            </div>

            {/* ── Section 3 : Coordonnées ─────────────────────────────────────── */}
            <div className="resv-section">
              <div className="resv-section-head">
                <div className="resv-section-icon"><User size={16} strokeWidth={1.75} /></div>
                <div>
                  <h2>Vos coordonnées</h2>
                  <p>Pour vous envoyer la confirmation et le bon de réservation</p>
                </div>
              </div>

              <div className="resv-fields">
                <div className="resv-row">
                  <Field id="firstName" label="Prénom" required error={errors.firstName} icon={User}>
                    <input
                      type="text" name="firstName"
                      className="resv-input"
                      value={form.firstName} onChange={handleChange}
                      placeholder="Jean" autoComplete="given-name"
                    />
                  </Field>
                  <Field id="lastName" label="Nom" required error={errors.lastName} icon={User}>
                    <input
                      type="text" name="lastName"
                      className="resv-input"
                      value={form.lastName} onChange={handleChange}
                      placeholder="Dupont" autoComplete="family-name"
                    />
                  </Field>
                </div>

                <div className="resv-row">
                  <Field id="email" label="Email" required error={errors.email} icon={Mail}>
                    <input
                      type="email" name="email"
                      className="resv-input"
                      value={form.email} onChange={handleChange}
                      placeholder="jean.dupont@email.fr" autoComplete="email"
                    />
                  </Field>
                  <Field id="phone" label="Téléphone" required error={errors.phone} icon={Phone}>
                    <input
                      type="tel" name="phone"
                      className="resv-input"
                      value={form.phone} onChange={handleChange}
                      placeholder="+33 6 12 34 56 78" autoComplete="tel"
                    />
                  </Field>
                </div>

                {/* RGPD */}
                <div className={`resv-gdpr ${errors.gdprConsent ? 'has-error' : ''}`}>
                  <input
                    type="checkbox" id="gdpr" name="gdprConsent"
                    checked={form.gdprConsent} onChange={handleChange}
                  />
                  <label htmlFor="gdpr">
                    J'accepte que mes données personnelles soient utilisées pour le traitement
                    de ma réservation, conformément à la{' '}
                    <Link to="/politique-rgpd" style={{ color: 'var(--color-accent-text)', textDecoration: 'underline' }}>
                      politique de confidentialité
                    </Link>.
                    Ces données ne seront pas transmises à des tiers. <strong>*</strong>
                  </label>
                </div>
                <AnimatePresence>
                  {errors.gdprConsent && (
                    <motion.div className="resv-error" {...fadeSlide} key="gdpr-err">
                      <AlertTriangle size={11} strokeWidth={2} /> {errors.gdprConsent}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className={`resv-gdpr ${errors.termsAccepted ? 'has-error' : ''}`}>
                  <input
                    type="checkbox" id="termsAccepted" name="termsAccepted"
                    checked={form.termsAccepted} onChange={handleChange}
                  />
                  <label htmlFor="termsAccepted">
                    J'ai lu et j'accepte les{' '}
                    <Link to="/cgu" style={{ color: 'var(--color-accent-text)', textDecoration: 'underline' }}>
                      conditions générales d'utilisation
                    </Link>. <strong>*</strong>
                  </label>
                </div>
                <AnimatePresence>
                  {errors.termsAccepted && (
                    <motion.div className="resv-error" {...fadeSlide} key="terms-err">
                      <AlertTriangle size={11} strokeWidth={2} /> {errors.termsAccepted}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ── Bouton de soumission ────────────────────────────────────────── */}
            <div className="resv-submit-area">
              <button
                type="submit"
                className="resv-submit-btn"
                disabled={loading}
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> Envoi en cours…</>
                  : <><Car size={16} strokeWidth={1.75} /> Confirmer ma réservation <ArrowRight size={15} strokeWidth={2} /></>
                }
              </button>
              <div className="resv-submit-note">
                <ShieldCheck size={13} strokeWidth={1.75} />
                Données chiffrées · Confirmation immédiate par email · Aucun paiement en ligne
              </div>
            </div>

          </form>
        </div>

      </div>
    </section>
  );
}
