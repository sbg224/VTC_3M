import { Link } from 'react-router-dom';

const features = [
  {
    icon: '🤝',
    title: 'Service Personnalisé',
    desc: 'Un chauffeur dédié, toujours le même. Une relation directe, sans intermédiaire.',
  },
  {
    icon: '⏱️',
    title: 'Ponctualité Garantie',
    desc: 'Suivi du trafic en temps réel. Présent à l\'heure, à chaque course, sans exception.',
  },
  {
    icon: '🛡️',
    title: 'Sécurité & Sérénité',
    desc: 'Chauffeur VTC agréé, véhicule assuré et entretenu. Vous êtes entre de bonnes mains.',
  },
  {
    icon: '🤫',
    title: 'Discrétion Absolue',
    desc: 'Confidentialité totale. Idéal pour vos déplacements professionnels ou personnels.',
  },
  {
    icon: '💳',
    title: 'Facturation Automatique',
    desc: 'Facture PDF envoyée immédiatement après la course. Parfait pour les notes de frais.',
  },
  {
    icon: '📱',
    title: 'Réservation Simple',
    desc: 'Réservez en ligne en moins d\'une minute, de jour comme de nuit.',
  },
];

const stats = [
  { number: '500+', label: 'Courses effectuées' },
  { number: '4.9★', label: 'Note moyenne client' },
  { number: '5 ans', label: 'D\'expérience VTC' },
  { number: '24/7', label: 'Disponible pour vous' },
];

const vehicleHighlights = [
  { icon: '🪑', label: 'Sièges cuir premium' },
  { icon: '❄️', label: 'Climatisation 4 zones' },
  { icon: '🔇', label: 'Habitacle silencieux' },
  { icon: '💧', label: 'Eau fraîche à bord' },
  { icon: '🔌', label: 'Chargeurs USB & sans fil' },
  { icon: '🧼', label: 'Véhicule nettoyé chaque jour' },
];

const destinations = [
  {
    icon: '✈️',
    title: 'Aéroport Toulouse-Blagnac',
    desc: 'Transfert avec suivi des vols en temps réel. Prise en charge à l\'arrivée.',
  },
  {
    icon: '🚉',
    title: 'Gare Matabiau',
    desc: 'Dépose et prise en charge directe sur le parvis, sans stress.',
  },
  {
    icon: '🏢',
    title: 'Déplacements professionnels',
    desc: 'Réunions, séminaires, événements d\'entreprise sur Toulouse et sa région.',
  },
  {
    icon: '🌆',
    title: 'Sorties & événements',
    desc: 'Restaurants, spectacles, mariages — arrivez en style et repartez l\'esprit léger.',
  },
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

export default function Home() {
  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="container hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span>⭐</span>
              <span>VTC Premium – Toulouse & Haute-Garonne (31)</span>
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
              <Link to="/reservation" className="btn btn-primary btn-lg">
                🚗 Réserver maintenant
              </Link>
              <a href="tel:+33751044407" className="btn btn-outline btn-lg">
                📞 Appeler directement
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <img
              src="/images/car-hero.jpeg"
              alt="Mercedes berline premium – 3M Drive"
              className="hero-car-img"
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
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            Votre chauffeur &amp; <span className="gold-accent">votre véhicule</span>
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'center' }}>
            Un service individuel, une relation de confiance directe
          </p>

          <div className="driver-vehicle-grid">
            {/* Présentation chauffeur */}
            <div className="driver-card">
              <div className="driver-avatar">
                <img src="/images/logo-3m.jpeg" alt="Logo 3M Drive" className="driver-logo-img" />
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
                  <span>✅ Carte VTC officielle</span>
                  <span>✅ Assurance professionnelle</span>
                  <span>✅ Tenue professionnelle</span>
                </div>
              </div>
            </div>

            {/* Présentation véhicule */}
            <div className="vehicle-card">
              <div className="vehicle-icon-block">
                <img src="/images/car-door.jpeg" alt="Portière berline 3M Drive" className="vehicle-photo" />
              </div>
              <h3>Berline premium</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '24px', fontSize: '0.92rem' }}>
                Jusqu'à 4 passagers · Confort &amp; luxe à bord
              </p>
              <div className="vehicle-highlights">
                {vehicleHighlights.map((h, i) => (
                  <div key={i} className="vehicle-highlight-item">
                    <span className="vehicle-highlight-icon">{h.icon}</span>
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
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            Pourquoi choisir <span className="gold-accent">3M Drive</span> ?
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'center' }}>
            Un chauffeur privé qui fait vraiment la différence
          </p>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
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
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            Vos <span className="gold-accent">destinations</span>
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'center' }}>
            Toulouse et toute la Haute-Garonne (31)
          </p>
          <div className="destinations-grid">
            {destinations.map((d, i) => (
              <div key={i} className="destination-card">
                <div className="destination-icon">{d.icon}</div>
                <div>
                  <h3>{d.title}</h3>
                  <p>{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <Link to="/reservation" className="btn btn-primary btn-lg">
              🧮 Simuler le prix de ma course
            </Link>
          </div>
        </div>
      </section>

      {/* ── GALERIE EXPÉRIENCE ────────────────────────────────────────────────── */}
      <section className="section gallery-section">
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            Une expérience <span className="gold-accent">premium</span>
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'center' }}>
            Du confort à bord à l'accueil personnalisé
          </p>
          <div className="gallery-grid">
            <div className="gallery-item gallery-item--large">
              <img src="/images/passenger.jpeg" alt="Confort à bord – 3M Drive" />
              <div className="gallery-caption">Confort &amp; discrétion à bord</div>
            </div>
            <div className="gallery-item">
              <img src="/images/airport.jpeg" alt="Accueil aéroport Toulouse – 3M Drive" />
              <div className="gallery-caption">Accueil personnalisé – Toulouse Airport</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ─────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            Comment ça <span className="gold-accent">fonctionne</span> ?
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'center' }}>
            Réservez votre course en 3 étapes simples
          </p>
          <div className="howto-grid">
            {[
              {
                step: '01', icon: '🧮',
                title: 'Simulez le prix',
                desc: 'Entrez vos adresses pour obtenir une estimation instantanée du tarif.',
              },
              {
                step: '02', icon: '📝',
                title: 'Confirmez la réservation',
                desc: 'Renseignez vos coordonnées, date et heure. Votre bon de réservation arrive par email.',
              },
              {
                step: '03', icon: '🚗',
                title: 'Profitez du trajet',
                desc: 'Votre chauffeur est ponctuel. La facture vous est envoyée automatiquement à l\'arrivée.',
              },
            ].map((item, i) => (
              <div key={i} className="howto-step">
                <div className="howto-icon-wrap">
                  <span className="howto-icon">{item.icon}</span>
                  <div className="howto-step-number">{item.step}</div>
                </div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <Link to="/reservation" className="btn btn-primary btn-lg">
              🚗 Réserver ma course maintenant
            </Link>
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ───────────────────────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--color-light)' }}>
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            Ils nous font <span className="gold-accent">confiance</span>
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'center' }}>
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
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            <span className="gold-accent">Contactez</span>-nous
          </h2>
          <p className="section-subtitle" style={{ textAlign: 'center' }}>
            Disponible 7j/7 pour tous vos déplacements à Toulouse
          </p>
          <div className="contact-grid">
            <div>
              {[
                { icon: '📞', title: 'Téléphone', info: '+33 7 51 04 44 07', sub: 'Disponible 7j/7 – 24h/24' },
                { icon: '✉️', title: 'Email', info: '3m.services31@gmail.com', sub: 'Réponse rapide garantie' },
                { icon: '📍', title: 'Zone d\'intervention', info: 'Toulouse & Haute-Garonne (31)', sub: 'Longues distances sur demande' },
                { icon: '⏰', title: 'Horaires', info: '24h/24 – 7j/7', sub: 'Jours fériés inclus' },
              ].map((item, i) => (
                <div key={i} className="contact-info-item">
                  <div className="contact-icon">{item.icon}</div>
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
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🚗</div>
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
              <Link to="/reservation" className="btn btn-primary" style={{ display: 'inline-block' }}>
                Simuler &amp; Réserver
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
