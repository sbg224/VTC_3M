import { Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import {
  Users, Clock, ShieldCheck, EyeOff, Receipt, Smartphone,
  Armchair, Wind, VolumeX, Droplets, Zap, Sparkles, Star,
  Plane, Train, Building2, Landmark,
  Phone, Mail, MapPin, Calculator, Car,
} from 'lucide-react';
import { gsap, ScrollTrigger } from '../animations/gsap';

const features = [
  { Icon: Users,      title: 'Service Personnalisé',   desc: 'Un chauffeur dédié, toujours le même. Une relation directe, sans intermédiaire.' },
  { Icon: Clock,      title: 'Ponctualité Garantie',   desc: 'Suivi du trafic en temps réel. Présent à l\'heure, à chaque course, sans exception.' },
  { Icon: ShieldCheck,title: 'Sécurité & Sérénité',    desc: 'Chauffeur VTC agréé, véhicule assuré et entretenu. Vous êtes entre de bonnes mains.' },
  { Icon: EyeOff,     title: 'Discrétion Absolue',     desc: 'Confidentialité totale. Idéal pour vos déplacements professionnels ou personnels.' },
  { Icon: Receipt,    title: 'Facturation Automatique',desc: 'Facture PDF envoyée immédiatement après la course. Parfait pour les notes de frais.' },
  { Icon: Smartphone, title: 'Réservation Simple',     desc: 'Réservez en ligne en moins d\'une minute, de jour comme de nuit.' },
];

const stats = [
  { number: '500+', label: 'Courses effectuées' },
  { number: '4.9★', label: 'Note moyenne client' },
  { number: '5 ans', label: 'D\'expérience VTC' },
  { number: '24/7', label: 'Disponible pour vous' },
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
  { Icon: Plane,     title: 'Aéroport Toulouse-Blagnac', desc: 'Transfert avec suivi des vols en temps réel. Prise en charge à l\'arrivée.' },
  { Icon: Train,     title: 'Gare Matabiau',             desc: 'Dépose et prise en charge directe sur le parvis, sans stress.' },
  { Icon: Building2, title: 'Déplacements professionnels', desc: 'Réunions, séminaires, événements d\'entreprise sur Toulouse et sa région.' },
  { Icon: Landmark,  title: 'Sorties & événements',      desc: 'Restaurants, spectacles, mariages — arrivez en style et repartez l\'esprit léger.' },
];

const testimonials = [
  {
    text: 'Chauffeur très professionnel, ponctuel et discret. Le véhicule est impeccable. Je le sollicite systématiquement pour mes déplacements pro à Toulouse.',
    author: 'Sophie M.',
    role: 'Directrice commerciale – Toulouse',
  },
  {
    text: 'Réservation simple, suivi parfait du vol à Blagnac. Un vrai service premium à prix juste. Je recommande sans hésiter !',
    author: 'Thomas K.',
    role: 'Chef de projet – Haute-Garonne',
  },
  {
    text: 'La facture arrivait par email avant même que je rentre chez moi. Pratique, rapide et très agréable. Merci !',
    author: 'Marie-Claire D.',
    role: 'Consultante – Toulouse',
  },
];

const JSON_LD_LOCAL_BUSINESS = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'LocalBusiness',
      '@id': 'https://3mdrive.fr/#business',
      'name': '3M Drive',
      'legalName': '3M SERVICES 31',
      'description': 'Chauffeur VTC privé à Toulouse. Service premium, ponctuel et discret pour tous vos déplacements en Haute-Garonne (31).',
      'url': 'https://3mdrive.fr',
      'telephone': '+33751044407',
      'email': '3m.services31@gmail.com',
      'image': 'https://3mdrive.fr/images/logo-3m.jpeg',
      'logo': 'https://3mdrive.fr/images/logo-3m.jpeg',
      'priceRange': '€€',
      'currenciesAccepted': 'EUR',
      'openingHours': 'Mo-Su 00:00-24:00',
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': '1 rue Virginia Woolf',
        'addressLocality': 'Toulouse',
        'postalCode': '31000',
        'addressRegion': 'Haute-Garonne',
        'addressCountry': 'FR',
      },
      'geo': {
        '@type': 'GeoCoordinates',
        'latitude': 43.6047,
        'longitude': 1.4442,
      },
      'areaServed': {
        '@type': 'GeoCircle',
        'geoMidpoint': { '@type': 'GeoCoordinates', 'latitude': 43.6047, 'longitude': 1.4442 },
        'geoRadius': '100000',
      },
      'hasOfferCatalog': {
        '@type': 'OfferCatalog',
        'name': 'Services VTC 3M Drive',
        'itemListElement': [
          { '@type': 'Offer', 'itemOffered': { '@type': 'Service', 'name': 'Transfert aéroport Toulouse-Blagnac' } },
          { '@type': 'Offer', 'itemOffered': { '@type': 'Service', 'name': 'Transfert gare Matabiau' } },
          { '@type': 'Offer', 'itemOffered': { '@type': 'Service', 'name': 'Déplacements professionnels Toulouse' } },
          { '@type': 'Offer', 'itemOffered': { '@type': 'Service', 'name': 'Mise à disposition chauffeur privé' } },
        ],
      },
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.9',
        'bestRating': '5',
        'ratingCount': '47',
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://3mdrive.fr/#website',
      'url': 'https://3mdrive.fr',
      'name': '3M Drive',
      'description': 'Chauffeur VTC Premium à Toulouse – Haute-Garonne (31)',
      'inLanguage': 'fr-FR',
      'publisher': { '@id': 'https://3mdrive.fr/#business' },
      'potentialAction': {
        '@type': 'ReserveAction',
        'target': 'https://3mdrive.fr/reservation',
        'name': 'Réserver un VTC à Toulouse',
      },
    },
  ],
});

export default function Home() {
  const pageRef = useRef(null);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Contexte scopé au conteneur du composant — revert() nettoie tout
    const ctx = gsap.context(() => {

      // ── 1. Hero : cascade au chargement ─────────────────────────────────
      const hero = page.querySelector('.hero');
      if (hero) {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.from(hero.querySelector('.hero-badge'),             { y: 24, opacity: 0, duration: 0.5 }, 0.1)
          .from(hero.querySelector('.hero-title'),             { y: 32, opacity: 0, duration: 0.7 }, '-=0.2')
          .from(hero.querySelector('.hero-desc'),              { y: 20, opacity: 0, duration: 0.5 }, '-=0.3')
          .from(hero.querySelectorAll('.hero-actions .btn'),   { y: 16, opacity: 0, stagger: 0.12, duration: 0.4 }, '-=0.25')
          .from(hero.querySelector('.hero-car-img'),           { clipPath: 'inset(0 100% 0 0)', opacity: 0, duration: 1.0, ease: 'power4.inOut' }, 0.2)
          .from(hero.querySelector('.hero-scroll'),            { opacity: 0, duration: 0.4 }, '-=0.1');
      }

      // ── 2. Sections au scroll : titres + cartes en stagger ───────────────
      page.querySelectorAll('.section').forEach((section) => {
        const title = section.querySelector('.section-title');
        if (title) {
          gsap.from(title, {
            y: 28, opacity: 0, duration: 0.6,
            scrollTrigger: { trigger: title, start: 'top 88%', once: true },
          });
        }

        const sub = section.querySelector('.section-subtitle');
        if (sub) {
          gsap.from(sub, {
            y: 16, opacity: 0, duration: 0.5, delay: 0.08,
            scrollTrigger: { trigger: sub, start: 'top 88%', once: true },
          });
        }

        const cards = section.querySelectorAll(
          '.feature-card, .destination-card, .testimonial-card, .howto-step, .driver-card, .vehicle-card'
        );
        if (cards.length) {
          gsap.from(cards, {
            y: 20, opacity: 0, stagger: 0.08, duration: 0.55,
            ease: 'power3.out',
            clearProps: 'transform,opacity',   // nettoie les styles inline après animation
            scrollTrigger: { trigger: section, start: 'top 80%', once: true },
          });
        }
      });

      // ── 3. Galerie : clip-path reveal ────────────────────────────────────
      page.querySelectorAll('.gallery-item img').forEach((img, i) => {
        gsap.from(img, {
          clipPath: 'inset(0 100% 0 0)',
          duration: 0.9,
          delay: i * 0.15,
          ease: 'power4.inOut',
          scrollTrigger: { trigger: img, start: 'top 82%', once: true },
        });
      });

      // ── 4. Parallaxe image hero ───────────────────────────────────────────
      const heroImg = page.querySelector('.hero-car-img');
      if (heroImg) {
        gsap.to(heroImg, {
          y: -40, ease: 'none',
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: 'bottom top',
            scrub: 1.5,
          },
        });
      }

      // ── 5. Compteurs statistiques ─────────────────────────────────────────
      const statData = [
        { end: 500, suffix: '+' },
        { end: 4.9, suffix: '★', decimals: 1 },
        { end: 5,   suffix: ' ans' },
        { end: 24,  suffix: '/7' },
      ];
      page.querySelectorAll('.stat-number').forEach((el, i) => {
        const data = statData[i];
        if (!data) return;
        const original = el.textContent;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: data.end,
          duration: 1.8,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 82%', once: true },
          onUpdate() {
            el.textContent = data.decimals
              ? obj.val.toFixed(data.decimals) + data.suffix
              : Math.round(obj.val) + data.suffix;
          },
          onComplete() { el.textContent = original; },
        });
      });

    }, page); // scope = conteneur du composant

    // Recalcule les positions après mount (images/fonts peuvent changer la hauteur)
    ScrollTrigger.refresh();

    return () => {
      ctx.revert(); // kill tweens + ScrollTriggers + restaure les états CSS
    };
  }, []);

  return (
    <div ref={pageRef}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON_LD_LOCAL_BUSINESS }}
      />
      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="container hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <Star size={11} strokeWidth={2} />
              <span>VTC Premium – Toulouse &amp; Haute-Garonne (31)</span>
            </div>
            <h1 className="hero-title">
              Votre chauffeur<br />
              <span>privé à Toulouse</span>
            </h1>
            <p className="hero-desc">
              Transport privé haut de gamme, ponctuel et discret.
              Un chauffeur VTC agréé, un véhicule premium,
              une expérience irréprochable.
            </p>
            <div className="hero-actions">
              <Link to="/reservation" className="btn btn-primary btn-lg flex items-center gap-2" style={{ display: 'inline-flex' }}>
                <Car size={16} strokeWidth={1.5} /> Réserver maintenant
              </Link>
              <a href="tel:+33751044407" className="btn btn-outline btn-lg flex items-center gap-2" style={{ display: 'inline-flex' }}>
                <Phone size={16} strokeWidth={1.5} /> Appeler directement
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <img
              src="/images/car-hero.jpeg"
              alt="Mercedes berline premium – chauffeur VTC 3M Drive Toulouse"
              className="hero-car-img"
              width="560"
              height="373"
              fetchpriority="high"
            />
          </div>
        </div>
        <div className="hero-scroll">
          <span>Découvrir</span>
          <div className="hero-scroll-line"></div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────────── */}
      <section className="section stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <span className="stat-number">{s.number}</span>
                <p className="stat-label">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VOTRE CHAUFFEUR / VÉHICULE ────────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-light)' }}>
        <div className="container">
          <p className="section-label" style={{ textAlign: 'center', display: 'block' }}>Notre service</p>
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            Votre chauffeur &amp; <span className="gold-accent">votre véhicule</span>
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'center', margin: '0 auto var(--space-12)' }}>
            Un service individuel, une relation de confiance directe
          </p>

          <div className="driver-vehicle-grid">
            {/* Présentation chauffeur */}
            <div className="driver-card">
              <div className="driver-avatar">
                <img src="/images/logo-3m.jpeg" alt="Logo 3M Drive – chauffeur VTC Toulouse" className="driver-logo-img" width="64" height="64" loading="lazy" />
              </div>
              <div className="driver-info">
                <div className="driver-badge">Chauffeur VTC Agréé · Toulouse (31)</div>
                <h3>3M Drive</h3>
                <p>
                  Chauffeur privé indépendant basé à Toulouse, je mets tout en œuvre
                  pour vous offrir un déplacement confortable, ponctuel et discret.
                </p>
                <p>
                  Que ce soit pour un transfert aéroport, une réunion d'affaires
                  ou un événement privé, vous bénéficiez d'une attention personnalisée
                  à chaque course.
                </p>
                <div className="driver-badges">
                  <span><ShieldCheck size={13} strokeWidth={1.5} style={{ display: 'inline', marginRight: 4 }} /> Carte VTC officielle</span>
                  <span><ShieldCheck size={13} strokeWidth={1.5} style={{ display: 'inline', marginRight: 4 }} /> Assurance professionnelle</span>
                  <span><ShieldCheck size={13} strokeWidth={1.5} style={{ display: 'inline', marginRight: 4 }} /> Tenue professionnelle</span>
                </div>
              </div>
            </div>

            {/* Présentation véhicule */}
            <div className="vehicle-card">
              <div className="vehicle-icon-block">
                <img src="/images/car-door.jpeg" alt="Portière berline premium – véhicule VTC 3M Drive Toulouse" className="vehicle-photo" width="600" height="180" loading="lazy" />
              </div>
              <h3>Berline premium</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '24px', fontSize: '0.92rem' }}>
                Jusqu'à 4 passagers · Confort &amp; luxe à bord
              </p>
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

      {/* ── POURQUOI NOUS CHOISIR ─────────────���───────────────────────────────── */}
      <section className="section features">
        <div className="container">
          <p className="section-label" style={{ textAlign: 'center', display: 'block' }}>Pourquoi nous</p>
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            Pourquoi choisir <span className="gold-accent">3M Drive</span> ?
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'center', margin: '0 auto var(--space-12)' }}>
            Un chauffeur privé qui fait vraiment la différence
          </p>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon"><f.Icon size={22} strokeWidth={1.5} /></div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DESTINATIONS ──────────────────────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-light)' }}>
        <div className="container">
          <p className="section-label" style={{ textAlign: 'center', display: 'block' }}>Où nous intervenons</p>
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            Vos <span className="gold-accent">destinations</span>
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'center', margin: '0 auto var(--space-12)' }}>
            Toulouse et toute la Haute-Garonne (31)
          </p>
          <div className="destinations-grid-wrap">
            <div className="destinations-grid">
              {destinations.map((d, i) => (
                <div key={i} className="destination-card">
                  <div className="destination-icon"><d.Icon size={20} strokeWidth={1.5} /></div>
                  <div>
                    <h3>{d.title}</h3>
                    <p>{d.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="section-cta">
            <Link to="/reservation" className="btn btn-primary btn-lg flex items-center gap-2" style={{ display: 'inline-flex' }}>
              <Calculator size={16} strokeWidth={1.5} /> Simuler le prix de ma course
            </Link>
          </div>
        </div>
      </section>

      {/* ── GALERIE EXPÉRIENCE ────────────────────────────────────────────────── */}
      <section className="section gallery-section">
        <div className="container">
          <p className="section-label" style={{ textAlign: 'center', display: 'block' }}>À bord</p>
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            Une expérience <span className="gold-accent">premium</span>
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'center', margin: '0 auto var(--space-12)' }}>
            Du confort à bord à l'accueil personnalisé
          </p>
          <div className="gallery-grid">
            <div className="gallery-item gallery-item--large">
              <img src="/images/passenger.jpeg" alt="Passager en berline premium – confort et discrétion à bord, VTC Toulouse" width="800" height="340" loading="lazy" />
              <div className="gallery-caption">Confort &amp; discrétion à bord</div>
            </div>
            <div className="gallery-item">
              <img src="/images/airport.jpeg" alt="Chauffeur VTC accueil personnalisé à l'aéroport Toulouse-Blagnac – 3M Drive" width="533" height="340" loading="lazy" />
              <div className="gallery-caption">Accueil personnalisé – Toulouse Airport</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ─────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <p className="section-label" style={{ textAlign: 'center', display: 'block' }}>Simple &amp; rapide</p>
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            Comment ça <span className="gold-accent">fonctionne</span> ?
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'center', margin: '0 auto var(--space-12)' }}>
            Réservez votre course en 3 étapes simples
          </p>
          <div className="howto-grid">
            {[
              { step: '01', Icon: Calculator, title: 'Simulez le prix',        desc: 'Entrez vos adresses pour obtenir une estimation instantanée du tarif.' },
              { step: '02', Icon: Receipt,    title: 'Confirmez la réservation', desc: 'Renseignez vos coordonnées, date et heure. Votre bon de réservation arrive par email.' },
              { step: '03', Icon: Car,        title: 'Profitez du trajet',       desc: 'Votre chauffeur est ponctuel. La facture vous est envoyée automatiquement à l\'arrivée.' },
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
      <section className="section" style={{ background: 'var(--color-light)' }}>
        <div className="container">
          <p className="section-label" style={{ textAlign: 'center', display: 'block' }}>Avis clients</p>
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            Ils nous font <span className="gold-accent">confiance</span>
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'center', margin: '0 auto var(--space-12)' }}>
            Clients satisfaits à Toulouse et en Haute-Garonne
          </p>
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
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            <span className="gold-accent">Contactez</span>-nous
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'center', margin: '0 auto var(--space-12)' }}>
            Disponible 7j/7 pour tous vos déplacements à Toulouse
          </p>
          <div className="contact-grid">
            <div>
              {[
                { Icon: Phone,  title: 'Téléphone',          info: '+33 7 51 04 44 07',              sub: 'Disponible 7j/7 – 24h/24' },
                { Icon: Mail,   title: 'Email',              info: '3m.services31@gmail.com',        sub: 'Réponse rapide garantie' },
                { Icon: MapPin, title: 'Zone d\'intervention', info: 'Toulouse & Haute-Garonne (31)', sub: 'Longues distances sur demande' },
                { Icon: Clock,  title: 'Horaires',            info: '24h/24 – 7j/7',                 sub: 'Jours fériés inclus' },
              ].map((item, i) => (
                <div key={i} className="contact-info-item">
                  <div className="contact-icon"><item.Icon size={18} strokeWidth={1.5} /></div>
                  <div>
                    <h4>{item.title}</h4>
                    <p style={{ color: 'var(--color-primary)', fontWeight: '600' }}>{item.info}</p>
                    <p>{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              background: 'var(--color-primary)', borderRadius: 'var(--radius-lg)',
              padding: '40px', color: 'white', textAlign: 'center',
            }}>
              <Car size={48} strokeWidth={1} style={{ color: 'var(--color-accent)', margin: '0 auto 20px' }} />
              <h3 style={{
                fontFamily: 'var(--font-heading)', fontSize: '1.8rem',
                color: 'var(--color-accent)', marginBottom: '16px',
              }}>
                Prêt à partir ?
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '32px', fontSize: '0.95rem' }}>
                Simulez le prix de votre trajet et réservez en quelques secondes.
                Service premium, tarifs transparents.
              </p>
              <Link to="/reservation" className="btn btn-primary">
                Simuler &amp; Réserver
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
