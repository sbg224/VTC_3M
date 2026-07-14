import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, Clock, ShieldCheck, EyeOff, Receipt, Smartphone,
  Armchair, Wind, VolumeX, Droplets, Zap, Sparkles, Star,
  Plane, Train, Building2, Landmark,
  Phone, MapPin, Car, Calculator,
  Loader2, AlertTriangle, Euro, ArrowRight, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap, ScrollTrigger } from '../animations/gsap';
import { simulateAPI, publicStatsAPI, driverPublicAPI } from '../services/api';
import Seo from '../components/Seo';
import FeatureSteps from '../components/FeatureSteps';

// ── Données ───────────────────────────────────────────────────────────────────

const features = [
  { Icon: Users,       title: 'Service Personnalisé',    desc: 'Un chauffeur dédié, toujours le même. Une relation directe, sans intermédiaire.', image: '/images/passenger.jpeg' },
  { Icon: Clock,       title: 'Ponctualité Garantie',    desc: 'Suivi du trafic en temps réel. Présent à l\'heure, à chaque course, sans exception.', image: '/images/car-hero.jpeg' },
  { Icon: ShieldCheck, title: 'Sécurité & Sérénité',     desc: 'Chauffeur VTC agréé, véhicule assuré et entretenu. Vous êtes entre de bonnes mains.', image: '/images/car-door.jpeg' },
  { Icon: EyeOff,      title: 'Discrétion Absolue',      desc: 'Confidentialité totale. Idéal pour vos déplacements professionnels ou personnels.', image: '/images/airport.jpeg' },
  { Icon: Receipt,     title: 'Facturation Automatique', desc: 'Facture PDF envoyée immédiatement après la course. Parfait pour les notes de frais.', image: '/images/passenger.jpeg' },
  { Icon: Smartphone,  title: 'Réservation Simple',      desc: 'Réservez en ligne en moins d\'une minute, de jour comme de nuit.', image: '/images/car-hero.jpeg' },
];

// Stats par défaut pendant le chargement
const DEFAULT_STATS = [
  { key: 'totalCompleted', suffix: '+',      label: 'Courses effectuées' },
  { key: 'uniqueClients',  suffix: '+',      label: 'Clients accompagnés' },
  { key: 'yearsActive',    suffix: ' an(s)', label: 'D\'expérience VTC' },
  { key: 'availability',   suffix: '',       label: 'Disponible pour vous' },
];

const vehicleHighlights = [
  { Icon: Armchair, label: 'Sièges cuir premium' },
  { Icon: Wind,     label: 'Climatisation 4 zones' },
  { Icon: VolumeX,  label: 'Habitacle silencieux' },
  { Icon: Droplets, label: 'Eau fraîche à bord' },
  { Icon: Zap,      label: 'Chargeurs USB & sans fil' },
  { Icon: Sparkles, label: 'Véhicule nettoyé chaque jour' },
];

const destinations = [
  { Icon: Plane,     title: 'Aéroport Toulouse-Blagnac', desc: 'Transfert avec suivi des vols en temps réel. Prise en charge à l\'arrivée.', image: '/images/Aereport.jpg' },
  { Icon: Train,     title: 'Gare Matabiau',              desc: 'Dépose et prise en charge directe sur le parvis, sans stress.', image: '/images/gare-2.jpg' },
  { Icon: Building2, title: 'Déplacements professionnels', desc: 'Réunions, séminaires, événements d\'entreprise sur Toulouse et sa région.', image: '/images/professionnel.jpg' },
  { Icon: Landmark,  title: 'Sorties & événements',       desc: 'Restaurants, spectacles, mariages — arrivez en style et repartez l\'esprit léger.', image: '/images/evenement.jpg' },
];

const testimonials = [
  { text: 'Chauffeur très professionnel, ponctuel et discret. Le véhicule est impeccable. Je le sollicite systématiquement pour mes déplacements pro à Toulouse.', author: 'Sophie M.', role: 'Directrice commerciale – Toulouse' },
  { text: 'Réservation simple, suivi parfait du vol à Blagnac. Un vrai service premium à prix juste. Je recommande sans hésiter !', author: 'Thomas K.', role: 'Chef de projet – Haute-Garonne' },
  { text: 'La facture arrivait par email avant même que je rentre chez moi. Pratique, rapide et très agréable. Merci !', author: 'Marie-Claire D.', role: 'Consultante – Toulouse' },
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
      'name': '3M Drive', 'legalName': '3M SERVICES 31',
      'description': 'Chauffeur VTC privé à Toulouse. Service premium, ponctuel et discret pour tous vos déplacements en Haute-Garonne (31).',
      'url': 'https://3mdrive.fr', 'telephone': '+33751044407', 'email': '3m.services31@gmail.com',
      'logo': 'https://3mdrive.fr/images/logo-3m-new.svg', 'priceRange': '€€',
      'currenciesAccepted': 'EUR', 'openingHours': 'Mo-Su 00:00-24:00',
      'address': { '@type': 'PostalAddress', 'streetAddress': '1 rue Virginia Woolf', 'addressLocality': 'Toulouse', 'postalCode': '31000', 'addressRegion': 'Haute-Garonne', 'addressCountry': 'FR' },
      'aggregateRating': { '@type': 'AggregateRating', 'ratingValue': '4.9', 'bestRating': '5', 'ratingCount': '47' },
    },
  ],
});

// ── Page principale ───────────────────────────────────────────────────────────
// Scroll doux vers le simulateur hero
function scrollToSimulator(e) {
  if (e) e.preventDefault();
  const el = document.getElementById('hero-simulator');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export default function Home() {
  const pageRef   = useRef(null);
  const [liveStats, setLiveStats] = useState(null); // null = chargement
  const [drivers,   setDrivers]   = useState([]);

  // ── Chargement stats publiques depuis la DB ──────────────────────────────────
  useEffect(() => {
    publicStatsAPI.get()
      .then(({ data }) => setLiveStats(data))
      .catch(() => {
        // Fallback si l'API échoue : valeurs neutres non-mensongères
        setLiveStats({ totalCompleted: null, uniqueClients: null, yearsActive: null, availability: '24/7' });
      });
  }, []);

  // ── Chargement des vrais chauffeurs actifs depuis la DB ──────────────────────
  useEffect(() => {
    driverPublicAPI.getPublicList()
      .then(({ data }) => setDrivers(data.drivers || []))
      .catch(() => setDrivers([]));
  }, []);

  // Construit le tableau affiché depuis les stats live
  const displayStats = DEFAULT_STATS.map(s => {
    if (!liveStats) return { number: '—', label: s.label };
    const val = liveStats[s.key];
    if (val === null || val === undefined) return { number: '—', label: s.label };
    if (s.key === 'availability') return { number: val, label: s.label };
    if (s.key === 'yearsActive')  return { number: val === 0 ? '< 1 an' : `${val}${s.suffix}`, label: s.label };
    return { number: `${val}${s.suffix}`, label: s.label };
  });

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      const heroLeft = page.querySelector('.hero-left-content');
      if (heroLeft) {
        gsap.from(heroLeft.children, { y: 28, opacity: 0, stagger: 0.1, duration: 0.65, ease: 'power3.out', delay: 0.1 });
      }

      page.querySelectorAll('.section').forEach((section) => {
        const title = section.querySelector('.section-title');
        if (title) gsap.from(title, { y: 28, opacity: 0, duration: 0.6, scrollTrigger: { trigger: title, start: 'top 88%', once: true } });
        const sub = section.querySelector('.section-subtitle');
        if (sub) gsap.from(sub, { y: 16, opacity: 0, duration: 0.5, delay: 0.08, scrollTrigger: { trigger: sub, start: 'top 88%', once: true } });
        const cards = section.querySelectorAll('.testimonial-card,.howto-step,.driver-card,.vehicle-card');
        if (cards.length) gsap.from(cards, { y: 20, opacity: 0, stagger: 0.08, duration: 0.55, ease: 'power3.out', clearProps: 'transform,opacity', scrollTrigger: { trigger: section, start: 'top 80%', once: true } });
      });

      // Destinations — galerie dispersée type "Shadway" : plusieurs photos visibles
      // simultanément à des tailles/positions différentes, celle du premier plan
      // nette et centrée, les autres décalées en coin et floutées. Chaque carte
      // parcourt en boucle ce cycle (loin → premier plan → loin) au fil du scroll.
      const destWrap = page.querySelector('.destinations-grid-wrap');
      const destCards = destWrap ? Array.from(destWrap.querySelectorAll('.destination-card--photo')) : [];
      if (destWrap && destCards.length > 1) {
        const stack = destWrap.querySelector('.destinations-stack');
        stack.classList.add('destinations-stack--pinned');

        const n = destCards.length;
        gsap.set(destCards, { xPercent: -50, yPercent: -50, transformOrigin: '50% 50%' });

        const render = (progress) => {
          const wrapRect = destWrap.getBoundingClientRect();
          destCards.forEach((card, i) => {
            const phase = (((i / n) + progress) % 1 + 1) % 1;
            const nearness = 1 - Math.abs(phase - 0.5) * 2; // 0 = loin, 1 = premier plan
            const eased = nearness * nearness * (3 - 2 * nearness); // smoothstep — pilote la taille/position
            // Le flou et le fondu ne s'appliquent que tout près de l'entrée/sortie
            // (comme dans la galerie de référence) : le reste du temps, y compris
            // en position secondaire décalée, la photo reste nette et opaque.
            const edge = Math.min(nearness / 0.2, 1);
            const edgeEased = edge * edge * (3 - 2 * edge);
            // Traversée continue : entre depuis la droite, passe au centre (premier
            // plan) à mi-cycle, ressort par la gauche — jamais deux cartes du même
            // côté en même temps. Léger biais vers le bas pour dégager le titre.
            const baseX = phase <= 0.5 ? (0.5 - phase) * 2 : -(phase - 0.5) * 2;
            gsap.set(card, {
              x: baseX * 0.55 * wrapRect.width * (1 - eased),
              y: 0.5 * wrapRect.height * (1 - eased),
              scale: 0.5 + eased * 0.5,
              opacity: edgeEased,
              filter: `blur(${(1 - edgeEased) * 16}px)`,
              zIndex: Math.round(eased * 100),
            });
            const content = card.querySelector('.destination-card-content');
            if (content) gsap.set(content, { opacity: eased > 0.72 ? (eased - 0.72) / 0.28 : 0 });
          });
        };
        render(0);

        const segment = 480;
        ScrollTrigger.create({
          trigger: destWrap,
          start: 'top top+=80',
          end: `+=${segment * n}`,
          scrub: 0.5,
          pin: true,
          onUpdate: (self) => render(self.progress),
        });
      }

      // Compteurs animés — sur les valeurs numériques uniquement
      page.querySelectorAll('.stat-number').forEach((el) => {
        const raw = el.textContent.trim();
        const match = raw.match(/^(\d+)/);
        if (!match) return; // skip '—', '24/7', '< 1 an', etc.
        const end = parseFloat(match[1]);
        const suffix = raw.slice(match[1].length);
        const obj = { val: 0 };
        gsap.to(obj, {
          val: end, duration: 1.6, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 82%', once: true },
          onUpdate() { el.textContent = Math.round(obj.val) + suffix; },
          onComplete() { el.textContent = raw; },
        });
      });
    }, page);

    ScrollTrigger.refresh();

    // Les grandes photos (destinations, hero…) se chargent après ce premier
    // refresh : tant que ScrollTrigger ne recalcule pas une fois la mise en
    // page définitive connue, ses positions de pin restent basées sur une
    // page plus courte et le bloc épinglé se déclenche trop tôt, recouvrant
    // les sections précédentes (observé sur mobile). On reprogramme un
    // refresh dès que chaque image a fini de charger.
    const images = Array.from(page.querySelectorAll('img'));
    const pending = images.filter((img) => !img.complete);
    let refreshTimeout;
    const scheduleRefresh = () => {
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => ScrollTrigger.refresh(), 60);
    };
    pending.forEach((img) => {
      img.addEventListener('load', scheduleRefresh);
      img.addEventListener('error', scheduleRefresh);
    });
    window.addEventListener('load', scheduleRefresh);

    return () => {
      clearTimeout(refreshTimeout);
      pending.forEach((img) => {
        img.removeEventListener('load', scheduleRefresh);
        img.removeEventListener('error', scheduleRefresh);
      });
      window.removeEventListener('load', scheduleRefresh);
      ctx.revert();
    };
  }, []);

  return (
    <div ref={pageRef}>
      <Seo
        title="3M Drive, Chauffeur VTC Premium à Toulouse"
        description="Chauffeur VTC privé à Toulouse, transferts aéroport Blagnac, gare Matabiau, déplacements professionnels et service premium 24h/24 en Haute-Garonne."
        canonicalPath="/"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON_LD_LOCAL_BUSINESS }} />

      {/* ── HERO PLEIN ÉCRAN ──────────────────────────────────────────────────── */}
      <section className="hero-full">
        <div className="hero-full-bg">
          <picture>
            <source media="(max-width: 768px)" srcSet="/images/car-hero-toulouse-mobile.jpg" />
            <img src="/images/car-hero-toulouse.jpg" alt="Berline 3M Drive au bord de la Garonne à Toulouse, coucher de soleil" className="hero-full-img" fetchpriority="high" />
          </picture>
          <div className="hero-full-overlay" />
        </div>

        <div className="container hero-full-inner">
          {/* Gauche : branding */}
          <div className="hero-left-content">
            <div className="hero-badge">
              <Star size={11} strokeWidth={2} />
              <span>VTC Premium – Toulouse &amp; Haute-Garonne (31)</span>
            </div>

            <p className="hero-greeting">Bonjour 👋</p>
            <h1 className="hero-title-new">
              Votre chauffeur<br />
              <span className="gold-accent">privé à Toulouse</span>
            </h1>

            <p className="hero-desc-new">
              Transport privé haut de gamme, ponctuel et discret.
              Calculez votre prix en temps réel, réservez en 60 secondes.
            </p>



            <a href="tel:+33751044407" className="hero-phone-link">
              <Phone size={15} strokeWidth={1.5} /> +33 7 51 04 44 07
            </a>
          </div>

          {/* Droite : formulaire */}
          <div id="hero-simulator" className="hero-right-content">
            <HeroBookingForm />
          </div>
        </div>

        <div className="hero-scroll-hint">
          <ChevronDown size={18} strokeWidth={1.5} />
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────────── */}
      <section className="section stats-section">
        <div className="container">
          <div className="stats-grid">
            {displayStats.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <span className="stat-number">{s.number}</span>
                <p className="stat-label">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VOTRE CHAUFFEUR / VÉHICULE ────────────────────────────────────────── */}
      <section className="section" style={{ background: '#F7F5F0' }}>
        <div className="container">
          <p className="section-label" style={{ textAlign: 'center', display: 'block' }}>Notre service</p>
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            Votre chauffeur &amp; <span className="gold-accent">votre véhicule</span>
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'center', margin: '0 auto var(--space-12)' }}>
            Un service individuel, une relation de confiance directe
          </p>
          <div className="driver-vehicle-grid">
            {drivers.map((d) => {
              const displayName = d.businessName || d.name;
              const initials = displayName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
              return (
                <div className="driver-card" key={d.id}>
                  <div className="driver-avatar">{initials}</div>
                  <div className="driver-info">
                    <div className="driver-badge">Chauffeur VTC Agréé · Toulouse (31)</div>
                    <h3>{displayName}</h3>
                    {d.rating != null && (
                      <p style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star size={13} strokeWidth={1.5} style={{ color: 'var(--color-accent)' }} />
                        {d.rating.toFixed(1)}/5 · {d.reviewCount} avis client{d.reviewCount > 1 ? 's' : ''}
                      </p>
                    )}
                    <p>Chauffeur privé indépendant basé à Toulouse, engagé à offrir un déplacement confortable, ponctuel et discret.</p>
                    <p>Que ce soit pour un transfert aéroport, une réunion d'affaires ou un événement privé, vous bénéficiez d'une attention personnalisée à chaque course.</p>
                    <div className="driver-badges">
                      <span><ShieldCheck size={13} strokeWidth={1.5} style={{ display: 'inline', marginRight: 4 }} /> Carte VTC officielle</span>
                      <span><ShieldCheck size={13} strokeWidth={1.5} style={{ display: 'inline', marginRight: 4 }} /> Assurance professionnelle</span>
                      <span><ShieldCheck size={13} strokeWidth={1.5} style={{ display: 'inline', marginRight: 4 }} /> Tenue professionnelle</span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="vehicle-card">
              <div className="vehicle-icon-block">
                <img src="/images/car-door.jpeg" alt="Portière berline premium VTC 3M Drive" className="vehicle-photo" width="600" height="180" loading="lazy" />
              </div>
              <h3>Berline premium</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '24px', fontSize: '0.92rem' }}>Jusqu'à 4 passagers · Confort &amp; luxe à bord</p>
              <div className="vehicle-highlights">
                {vehicleHighlights.map((h, i) => (
                  <div key={i} className="vehicle-highlight-item">
                    <span className="vehicle-highlight-icon"><h.Icon size={16} strokeWidth={1.5} /></span>
                    <span>{h.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── POURQUOI NOUS ─────────────────────────────────────────────────────── */}
      <section className="section features">
        <div className="container">
          <p className="section-label" style={{ textAlign: 'center', display: 'block' }}>Pourquoi nous</p>
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            Pourquoi choisir <span className="gold-accent">3M Drive</span> ?
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'center', margin: '0 auto var(--space-12)' }}>
            Un chauffeur privé qui fait vraiment la différence
          </p>
          <FeatureSteps features={features} />
        </div>
      </section>

      {/* ── DESTINATIONS ──────────────────────────────────────────────────────── */}
      <section className="section" style={{ background: '#F7F5F0' }}>
        <div className="container">
          <p className="section-label" style={{ textAlign: 'center', display: 'block' }}>Où nous intervenons</p>
          <h2 className="section-title" style={{ textAlign: 'center' }}>Vos <span className="gold-accent">destinations</span></h2>
          <p className="section-subtitle" style={{ textAlign: 'center', margin: '0 auto var(--space-12)' }}>Toulouse et toute la Haute-Garonne (31)</p>
          <div className="destinations-grid-wrap">
            <div className="destinations-stack">
              {destinations.map((d, i) => (
                <div
                  key={i}
                  className="destination-card destination-card--photo"
                  onClick={scrollToSimulator}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && scrollToSimulator(e)}
                >
                  <img src={d.image} alt={d.title} className="destination-card-photo-img" loading="lazy" />
                  <div className="destination-card-scrim" />
                  <div className="destination-card-content">
                    <div className="destination-icon"><d.Icon size={20} strokeWidth={1.5} /></div>
                    <h3>{d.title}</h3>
                    <p>{d.desc}</p>
                    <div className="destination-cta">Estimer ce trajet <ArrowRight size={13} strokeWidth={2} /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="section-cta">
            <button onClick={scrollToSimulator} className="btn btn-primary btn-lg flex items-center gap-2" style={{ display: 'inline-flex' }}>
              <Calculator size={16} strokeWidth={1.5} /> Simuler le prix de ma course
            </button>
          </div>
        </div>
      </section>

      {/* ── EXPÉRIENCE À BORD — bento premium ────────────────────────────────── */}
      <section className="section exp-section">
        <div className="container">
          <p className="section-label exp-label">À bord</p>
          <h2 className="section-title exp-title">Une expérience <span className="gold-accent">premium</span></h2>
          <p className="section-subtitle exp-subtitle">Du confort à bord à l'accueil personnalisé</p>

          <div className="exp-bento">

            {/* ── Grande image principale avec stats flottantes ── */}
            <div className="exp-card exp-card--main">
              <img src="/images/passenger.jpeg" alt="Passager en berline premium – VTC Toulouse" className="exp-img" loading="lazy" />
              <div className="exp-overlay" />
              <div className="exp-main-content">
                <div className="exp-floating-tag">
                  <Star size={11} strokeWidth={2} /> Service 5 étoiles
                </div>
                <div className="exp-mini-stats">
                  <div className="exp-mini-stat">
                    <span>24/7</span><small>disponible</small>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Image secondaire aéroport ── */}
            <div className="exp-card exp-card--secondary">
              <img src="/images/Aereport.jpg" alt="Accueil personnalisé aéroport Toulouse-Blagnac" className="exp-img" loading="lazy" />
              <div className="exp-overlay exp-overlay--strong" />
              <div className="exp-secondary-label">
                <Plane size={13} strokeWidth={1.75} /> Toulouse-Blagnac
              </div>
            </div>

            {/* ── Highlights véhicule + CTA ── */}
            <div className="exp-card exp-card--highlights">
              <h3 className="exp-highlights-title">
                <Car size={16} strokeWidth={1.5} /> À bord de votre berline
              </h3>
              <div className="exp-highlights-grid">
                {vehicleHighlights.map((h, i) => (
                  <div key={i} className="exp-highlight-item">
                    <span className="exp-highlight-icon"><h.Icon size={14} strokeWidth={1.5} /></span>
                    <span>{h.label}</span>
                  </div>
                ))}
              </div>
              <Link to="/reservation" className="exp-reserve-btn">
                Réserver maintenant <ArrowRight size={14} strokeWidth={2} />
              </Link>
              <p className="exp-reserve-note">
                <ShieldCheck size={11} strokeWidth={1.5} /> Tarif fixe · Aucun supplément · Confirmation immédiate
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ─────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <p className="section-label" style={{ textAlign: 'center', display: 'block' }}>Simple &amp; rapide</p>
          <h2 className="section-title" style={{ textAlign: 'center' }}>Comment ça <span className="gold-accent">fonctionne</span> ?</h2>
          <p className="section-subtitle" style={{ textAlign: 'center', margin: '0 auto var(--space-12)' }}>Réservez votre course en 3 étapes simples</p>
          <div className="howto-grid">
            {[
              { step: '01', Icon: Calculator, title: 'Calculez le prix',         desc: 'Entrez vos adresses sur la page d\'accueil pour obtenir un tarif instantané et transparent.' },
              { step: '02', Icon: Receipt,    title: 'Confirmez la réservation',  desc: 'Renseignez vos coordonnées, date et heure. Votre bon de réservation arrive par email.' },
              { step: '03', Icon: Car,        title: 'Profitez du trajet',        desc: 'Votre chauffeur est ponctuel. La facture vous est envoyée automatiquement à l\'arrivée.' },
            ].map((item, i) => (
              <div key={i} className="howto-step">
                <div className="howto-icon-wrap">
                  <span className="howto-icon"><item.Icon size={22} strokeWidth={1.5} /></span>
                  <div className="howto-step-number">{item.step}</div>
                </div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="section-cta">
            <Link to="/reservation" className="btn btn-primary btn-lg flex items-center gap-2" style={{ display: 'inline-flex' }}>
              <Car size={16} strokeWidth={1.5} /> Réserver ma course maintenant
            </Link>
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ───────────────────────────────────────────────────────── */}
      <section className="section" style={{ background: '#F7F5F0' }}>
        <div className="container">
          <p className="section-label" style={{ textAlign: 'center', display: 'block' }}>Avis clients</p>
          <h2 className="section-title" style={{ textAlign: 'center' }}>Ils nous font <span className="gold-accent">confiance</span></h2>
          <p className="section-subtitle" style={{ textAlign: 'center', margin: '0 auto var(--space-12)' }}>Clients satisfaits à Toulouse et en Haute-Garonne</p>
          <div className="testimonials-grid">
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card">
                <div className="testimonial-stars">★★★★★</div>
                <p className="testimonial-text">"{t.text}"</p>
                <div>
                  <div className="testimonial-author">{t.author}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-gray)' }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ───────────────────────────────────────────────────────────── */}
      <section className="section" id="contact">
        <div className="container">
          <p className="section-label" style={{ textAlign: 'center', display: 'block' }}>Disponible 24h/24</p>
          <h2 className="section-title" style={{ textAlign: 'center' }}><span className="gold-accent">Contactez</span>-nous</h2>
          <p className="section-subtitle" style={{ textAlign: 'center', margin: '0 auto var(--space-12)' }}>Disponible 7j/7 pour tous vos déplacements à Toulouse</p>
          <div className="contact-grid">
            <div>
              {[
                { Icon: MapPin, title: 'Zone d\'intervention',  info: 'Toulouse & Haute-Garonne (31)',  sub: 'Longues distances sur demande' },
                { Icon: Clock,  title: 'Horaires',              info: '24h/24 – 7j/7',                  sub: 'Jours fériés inclus' },
              ].map((item, i) => (
                <div key={i} className="contact-info-item">
                  <div className="contact-icon"><item.Icon size={18} strokeWidth={1.5} /></div>
                  <div>
                    <h3>{item.title}</h3>
                    <p style={{ color: 'var(--color-primary)', fontWeight: '600' }}>{item.info}</p>
                    <p>{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="contact-cta-card">
              <img src="/images/logo-3m-new.svg" alt="3M Drive" style={{ width: 72, height: 72, margin: '0 auto 20px', display: 'block' }} />
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', color: 'var(--color-accent)', marginBottom: '16px' }}>Prêt à partir ?</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '32px', fontSize: '0.95rem' }}>
                Calculez le prix de votre trajet directement sur la page d'accueil et réservez en quelques secondes.
              </p>
              <Link to="/reservation" className="btn btn-primary">Simuler &amp; Réserver</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
