import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock, ShieldCheck, Armchair, Wind, VolumeX, Droplets, Zap, Sparkles,
  Plane, Train, Building2, Landmark,
  Phone, MapPin, Car, Calculator,
  Loader2, AlertTriangle, Euro, ArrowRight, Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { simulateAPI, driverPublicAPI } from '../services/api';
import Seo from '../components/Seo';
import WhatsAppIcon from '../components/WhatsAppIcon';
import {
  CONTACT_EMAIL,
  CONTACT_PHONE_E164,
  CONTACT_PHONE_DISPLAY,
  WHATSAPP_URL,
  WHATSAPP_LABEL,
  WHATSAPP_ARIA_LABEL,
} from '../utils/contact';

// Les quatre trajets les plus demandés. `photo` reste à null tant que la photo
// réelle n'a pas été fournie : la carte affiche alors un emplacement neutre
// explicite plutôt qu'un visuel générique. Priorité de remplacement : Blagnac
// et Matabiau d'abord (les deux premières cartes lues), puis le déplacement
// professionnel.
//
// `price` n'est volontairement pas renseigné ici : aucun tarif ne doit être
// écrit en dur dans le JSX. Les montants viendront de PricingConfig via une
// route publique dédiée, pour suivre automatiquement toute modification de
// pricePerKm ou hourlyRate faite en administration.
const destinations = [
  {
    key: 'blagnac',
    Icon: Plane,
    title: 'Aéroport Toulouse-Blagnac',
    desc: 'Suivi des vols en temps réel, prise en charge en salle d\'arrivée.',
    photo: null, // ancienne image générée : /images/Aereport.webp
  },
  {
    key: 'matabiau',
    Icon: Train,
    title: 'Gare Matabiau',
    desc: 'Dépose et prise en charge directement sur le parvis.',
    photo: null, // ancienne image générée : /images/gare-2.webp
  },
  {
    key: 'pro',
    Icon: Building2,
    title: 'Déplacements professionnels',
    desc: 'Mise à disposition à l\'heure, 25 km inclus par heure, 2 h minimum.',
    photo: null, // ancienne image générée : /images/professionnel.webp
  },
  {
    key: 'evenement',
    Icon: Landmark,
    title: 'Sorties & événements',
    desc: 'Restaurants, spectacles, mariages. Aller-retour avec attente sur place.',
    photo: null, // ancienne image générée : /images/evenement.webp
  },
];

const vehicleHighlights = [
  { Icon: Armchair, label: 'Sièges cuir' },
  { Icon: Wind,     label: 'Climatisation 4 zones' },
  { Icon: VolumeX,  label: 'Habitacle silencieux' },
  { Icon: Droplets, label: 'Eau fraîche à bord' },
  { Icon: Zap,      label: 'Recharge sans fil' },
  { Icon: Sparkles, label: 'Nettoyé chaque jour' },
];

const HOWTO = [
  { n: 'Étape 1', title: 'Vous simulez',    desc: 'Départ, arrivée, date. Le prix s\'affiche immédiatement, tout compris.' },
  { n: 'Étape 2', title: 'Vous confirmez',  desc: 'Coordonnées, validation. La confirmation arrive par email et SMS.' },
  { n: 'Étape 3', title: 'On vous conduit', desc: 'Le chauffeur vous attend à l\'heure. La facture suit par email.' },
];

const DURATIONS = ['1h','2h','3h','4h','5h','6h','8h','10h','12h'];

// ── Formulaire hero intégré ───────────────────────────────────────────────────

function HeroBookingForm() {
  const navigate   = useNavigate();
  const [tab,        setTab]       = useState('transfert');
  const [departure,  setDeparture] = useState('');
  const [arrival,    setArrival]   = useState('');
  const [date,       setDate]      = useState('');
  const [time,       setTime]      = useState('');
  const [passengers, setPassengers]= useState('1');
  const [duration,   setDuration]  = useState('2h');
  const [loading,    setLoading]   = useState(false);
  const [result,     setResult]    = useState(null);
  const [error,      setError]     = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => { setResult(null); setError(''); }, [departure, arrival, tab]);

  const canCalculate = tab === 'transfert'
    ? departure.trim().length >= 3 && arrival.trim().length >= 3
    : departure.trim().length >= 3;

  const handleCalculate = async (e) => {
    e.preventDefault();
    if (!canCalculate) return;
    setError(''); setResult(null); setLoading(true);
    try {
      if (tab === 'transfert') {
        const { data } = await simulateAPI.calculate(departure.trim(), arrival.trim());
        setResult(data);
      } else {
        setResult({ type: 'disposition', duration });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Impossible de calculer l\'itinéraire. Vérifiez les adresses saisies.');
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = () => {
    navigate('/reservation', {
      state: {
        departure,
        arrival: tab === 'transfert' ? arrival : '',
        simData: result && tab === 'transfert' ? result : null,
        mode: tab,
        duration: tab === 'disposition' ? duration : undefined,
        date, time, passengers,
      },
    });
  };

  return (
    <motion.div
      className="hero-booking-card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.35 }}
    >
      {/* Tabs */}
      <div className="hb-tabs">
        <button className={`hb-tab ${tab === 'transfert' ? 'active' : ''}`} onClick={() => { setTab('transfert'); setResult(null); setError(''); }}>
          <Car size={14} strokeWidth={1.5} /> Transfert
        </button>
        <button className={`hb-tab ${tab === 'disposition' ? 'active' : ''}`} onClick={() => { setTab('disposition'); setResult(null); setError(''); }}>
          <Clock size={14} strokeWidth={1.5} /> Mise à disposition
        </button>
      </div>

      <form onSubmit={handleCalculate} className="hb-form">
        {/* Adresses */}
        <div className="hb-field-group">
          <div className="hb-field">
            <span className="hb-field-dot hb-dot-green" />
            <input type="text" className="hb-input" placeholder="Adresse de départ, aéroport, gare…" value={departure} onChange={e => setDeparture(e.target.value)} />
          </div>
          <AnimatePresence>
            {tab === 'transfert' && (
              <motion.div className="hb-field" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                <span className="hb-field-dot hb-dot-gold" />
                <input type="text" className="hb-input" placeholder="Adresse d'arrivée, aéroport, gare…" value={arrival} onChange={e => setArrival(e.target.value)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Date / Heure / Passagers / Durée */}
        <div className="hb-row">
          <div className="hb-small-field">
            <label className="hb-label">Date</label>
            <input type="date" className="hb-input hb-input-sm" value={date} min={today} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="hb-small-field">
            <label className="hb-label">Heure</label>
            <input type="time" className="hb-input hb-input-sm" value={time} onChange={e => setTime(e.target.value)} />
          </div>
          <div className="hb-small-field">
            <label className="hb-label">Passagers</label>
            <select className="hb-input hb-input-sm" value={passengers} onChange={e => setPassengers(e.target.value)}>
              {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} pass.</option>)}
            </select>
          </div>
          {tab === 'disposition' && (
            <div className="hb-small-field">
              <label className="hb-label">Durée</label>
              <select className="hb-input hb-input-sm" value={duration} onChange={e => setDuration(e.target.value)}>
                {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Erreur */}
        {error && (
          <div className="hb-error">
            <AlertTriangle size={12} strokeWidth={1.5} /> {error}
          </div>
        )}

        {/* Résultat prix */}
        <AnimatePresence>
          {result && (
            <motion.div className="hb-result" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              {result.type === 'disposition' ? (
                <div className="hb-result-row">
                  <div className="hb-result-info">
                    <span className="hb-result-label">Mise à disposition</span>
                    <span className="hb-result-value">{result.duration}</span>
                  </div>
                  <span className="hb-result-note">Tarif sur devis — contactez-nous</span>
                </div>
              ) : (
                <div className="hb-result-row">
                  <div className="hb-result-stats">
                    <span><MapPin size={11} strokeWidth={1.5} /> {result.distance_km} km</span>
                    <span><Clock size={11} strokeWidth={1.5} /> ~{result.duration_min} min</span>
                  </div>
                  <div className="hb-result-price">
                    <Euro size={16} strokeWidth={1.5} />
                    <span>{Number(result.estimatedPrice).toFixed(2)} €</span>
                    <small>TTC estimé</small>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Boutons */}
        {!result ? (
          <button type="submit" className="hb-btn-calculate" disabled={!canCalculate || loading}>
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Calcul en cours…</>
              : <><Calculator size={15} strokeWidth={1.5} /> Calculer le prix</>}
          </button>
        ) : (
          <div className="hb-actions">
            <button type="button" className="hb-btn-reset" onClick={() => { setResult(null); setError(''); }}>Recalculer</button>
            <button type="button" className="hb-btn-reserve" onClick={handleReserve}>
              Réserver maintenant <ArrowRight size={15} strokeWidth={2} />
            </button>
          </div>
        )}
      </form>

      <p className="hb-footer-note">
        <ShieldCheck size={11} strokeWidth={1.5} /> Tarif fixe · Aucun supplément · Confirmation immédiate
      </p>
    </motion.div>
  );
}

// ── JSON-LD ───────────────────────────────────────────────────────────────────
const JSON_LD_LOCAL_BUSINESS = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'LocalBusiness', '@id': 'https://3mdrive.fr/#business',
      'name': '3M Drive', 'legalName': 'AHADI Services',
      'description': 'Chauffeur VTC privé à Toulouse. Service premium, ponctuel et discret pour tous vos déplacements en Haute-Garonne (31).',
      'url': 'https://3mdrive.fr', 'telephone': CONTACT_PHONE_E164, 'email': CONTACT_EMAIL,
      'logo': 'https://3mdrive.fr/images/logo-3m-new.svg', 'priceRange': '€€',
      'currenciesAccepted': 'EUR', 'openingHours': 'Mo-Su 00:00-24:00',
      'address': { '@type': 'PostalAddress', 'streetAddress': '1 rue Virginia Woolf', 'addressLocality': 'Toulouse', 'postalCode': '31200', 'addressRegion': 'Haute-Garonne', 'addressCountry': 'FR' },
      // Pas d'aggregateRating tant qu'il n'y a pas de vrais avis clients en base
      // (voir modèle Review) — une note statique non connectée aux données
      // réelles est un risque de non-conformité aux consignes Google sur les
      // avis structurés. À réintroduire dynamiquement quand le volume d'avis
      // réels sera suffisant.
    },
  ],
});

// ── Page principale ───────────────────────────────────────────────────────────
// Défilement doux vers le simulateur du héros.
function scrollToSimulator(e) {
  if (e) e.preventDefault();
  const el = document.getElementById('hero-simulator');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export default function Home() {
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    driverPublicAPI.getPublicList()
      .then(({ data }) => setDrivers(data.drivers || []))
      .catch(() => setDrivers([]));
  }, []);

  const driver = drivers[0] || null;
  const driverName = driver ? (driver.businessName || driver.name) : null;
  const initials = driverName
    ? driverName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : null;

  return (
    <div className="hm">
      <Seo
        title="3M Drive, Chauffeur VTC Premium à Toulouse"
        description="Chauffeur VTC privé à Toulouse, transferts aéroport Blagnac, gare Matabiau, déplacements professionnels et service premium 24h/24 en Haute-Garonne."
        canonicalPath="/"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON_LD_LOCAL_BUSINESS }} />

      {/* ── HÉROS ──────────────────────────────────────────────────────────── */}
      <section className="hm-hero">
        <div className="hm-hero-bg">
          <picture>
            <source media="(max-width: 768px)" srcSet="/images/car-hero-toulouse-mobile.webp" />
            <img
              src="/images/car-hero-toulouse.webp"
              alt="Berline 3M Drive au bord de la Garonne à Toulouse, coucher de soleil"
              className="hm-hero-img"
              fetchpriority="high"
            />
          </picture>
          <div className="hm-hero-veil" />
        </div>

        <div className="container hm-hero-inner">
          <div className="hm-hero-copy">
            <h1 className="hm-hero-title">Votre chauffeur privé à Toulouse</h1>
            <p className="hm-hero-sub">
              Transferts aéroport, gare et déplacements professionnels.
              Prix annoncé avant le départ, jamais après.
            </p>
            <div className="hm-hero-meta">
              <a href={`tel:${CONTACT_PHONE_E164}`} className="hm-hero-phone">
                <Phone size={14} strokeWidth={1.5} /> {CONTACT_PHONE_DISPLAY}
              </a>
              <span className="hm-rule" />
              <span>Disponible 7j/7, 24h/24</span>
              <span className="hm-rule" />
              <span>Haute-Garonne (31)</span>
            </div>
          </div>

          <div id="hero-simulator" className="hm-hero-panel">
            <HeroBookingForm />
          </div>
        </div>
      </section>

      {/* ── DESTINATIONS ───────────────────────────────────────────────────── */}
      <section className="hm-sec">
        <div className="container">
          <header className="hm-sec-head">
            <p className="hm-eyebrow">Destinations</p>
            <h2 className="hm-title">Les trajets que l&apos;on nous demande le plus</h2>
            <p className="hm-lede">
              Toulouse et toute la Haute-Garonne. Chaque trajet se charge dans le simulateur.
            </p>
          </header>

          <div className="hm-dests">
            {destinations.map((d) => (
              <article key={d.key} className="hm-dest">
                <button
                  type="button"
                  className="hm-dest-btn"
                  onClick={scrollToSimulator}
                  aria-label={`Estimer un trajet : ${d.title}`}
                >
                  {d.photo ? (
                    <img src={d.photo} alt={d.title} className="hm-dest-photo" loading="lazy" />
                  ) : (
                    <span className="hm-dest-placeholder">
                      <d.Icon size={22} strokeWidth={1.5} />
                      <span>Photo à venir</span>
                    </span>
                  )}
                  <span className="hm-dest-body">
                    <span className="hm-dest-title">{d.title}</span>
                    <span className="hm-dest-desc">{d.desc}</span>
                    <span className="hm-dest-foot">
                      <span className="hm-dest-go">Estimer <ArrowRight size={14} strokeWidth={2} /></span>
                    </span>
                  </span>
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ──────────────────────────────────────────────── */}
      <section className="hm-sec hm-sec--alt">
        <div className="container">
          <header className="hm-sec-head">
            <p className="hm-eyebrow">Comment ça marche</p>
            <h2 className="hm-title">Trois étapes, une minute</h2>
          </header>
          <ol className="hm-steps">
            {HOWTO.map((s) => (
              <li key={s.n} className="hm-step">
                <span className="hm-step-n">{s.n}</span>
                <h3 className="hm-step-title">{s.title}</h3>
                <p className="hm-step-desc">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── LE CHAUFFEUR & LA BERLINE ──────────────────────────────────────── */}
      <section className="hm-sec">
        <div className="container">
          <header className="hm-sec-head">
            <p className="hm-eyebrow">Le service</p>
            <h2 className="hm-title">Un chauffeur, une berline</h2>
            <p className="hm-lede">
              Pas de plateforme, pas d&apos;intermédiaire. Vous savez qui vient vous chercher.
            </p>
          </header>

          <div className="hm-two">
            {driver && (
              <div className="hm-card">
                <div className="hm-who">
                  <span className="hm-avatar">{initials}</span>
                  <span>
                    <h3 className="hm-card-title">{driverName}</h3>
                    <p className="hm-card-meta">Chauffeur VTC agréé · Toulouse (31)</p>
                  </span>
                </div>
                <p className="hm-card-text">
                  Chauffeur privé indépendant basé à Toulouse, engagé à offrir un déplacement
                  confortable, ponctuel et discret.
                </p>
                <div className="hm-chips">
                  <span className="hm-chip"><Check size={12} strokeWidth={2.5} /> Carte VTC officielle</span>
                  <span className="hm-chip"><Check size={12} strokeWidth={2.5} /> Assurance professionnelle</span>
                </div>
              </div>
            )}

            <div className="hm-card">
              <h3 className="hm-card-title">Berline premium</h3>
              <p className="hm-card-meta">Jusqu&apos;à 4 passagers · 3 bagages</p>
              <ul className="hm-specs">
                {vehicleHighlights.map((h) => (
                  <li key={h.label}>
                    <h.Icon size={15} strokeWidth={1.5} /> {h.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ────────────────────────────────────────────────────────── */}
      <section className="hm-foot" id="contact">
        <div className="container">
          <div className="hm-foot-grid">
            <div>
              <p className="hm-eyebrow hm-eyebrow--dark">Contact</p>
              <h2 className="hm-title hm-title--dark">Une question, un trajet particulier ?</h2>
              <div className="hm-ways">
                <div className="hm-way">
                  <span><Phone size={13} strokeWidth={1.5} /> Téléphone</span>
                  <a href={`tel:${CONTACT_PHONE_E164}`}>{CONTACT_PHONE_DISPLAY}</a>
                </div>
                <div className="hm-way">
                  <span><WhatsAppIcon size={13} /> WhatsApp</span>
                  <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label={WHATSAPP_ARIA_LABEL}>
                    {WHATSAPP_LABEL}
                  </a>
                </div>
                <div className="hm-way">
                  <span><MapPin size={13} strokeWidth={1.5} /> Email</span>
                  <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                </div>
                <div className="hm-way">
                  <span><Clock size={13} strokeWidth={1.5} /> Zone</span>
                  <span className="hm-way-plain">Toulouse et Haute-Garonne (31)</span>
                </div>
              </div>
            </div>

            <div className="hm-foot-cta">
              <h3 className="hm-card-title hm-title--dark">Prêt à réserver ?</h3>
              <p>Obtenez votre prix en moins d&apos;une minute, sans créer de compte.</p>
              <button type="button" className="hm-btn" onClick={scrollToSimulator}>
                <Calculator size={15} strokeWidth={1.5} /> Calculer mon prix
              </button>
              <Link to="/reservation" className="hm-btn hm-btn--ghost">
                <Car size={15} strokeWidth={1.5} /> Réserver maintenant
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
