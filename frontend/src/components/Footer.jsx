import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-gold-bar"></div>
      <div className="container" style={{ paddingTop: '48px' }}>
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>🚗 3M Services 31</h3>
            <p>
              Votre chauffeur VTC privé à Toulouse. Service premium,
              discret et ponctuel pour tous vos déplacements en Haute-Garonne.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              {[
                { icon: '📍', href: '#contact' },
                { icon: '📞', href: 'tel:+33751044407' },
                { icon: '✉️', href: 'mailto:3m.services31@gmail.com' },
              ].map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  style={{
                    width: '40px', height: '40px',
                    background: 'rgba(201,162,39,0.15)',
                    borderRadius: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem', cursor: 'pointer',
                    textDecoration: 'none', transition: 'background 0.25s',
                  }}
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="footer-col">
            <h4>Navigation</h4>
            <ul>
              <li><Link to="/">Accueil</Link></li>
              <li><Link to="/reservation">Simuler &amp; Réserver</Link></li>
              <li><Link to="/#contact">Contact</Link></li>
              <li><Link to="/login">Espace chauffeur</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Contact</h4>
            <ul>
              <li><a href="tel:+33751044407">📞 +33 7 51 04 44 07</a></li>
              <li><a href="mailto:3m.services31@gmail.com">✉️ 3m.services31@gmail.com</a></li>
              <li>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                  📍 Toulouse, Haute-Garonne (31)
                </span>
              </li>
              <li style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '8px' }}>
                Disponible 7j/7 – 24h/24
              </li>
            </ul>
          </div>
        </div>

        <hr className="footer-divider" />

        <div className="footer-bottom">
          <span>© {year} 3M Services 31 – Toulouse. Tous droits réservés.</span>
          <span style={{ display: 'flex', gap: '20px' }}>
            <a href="#" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>Mentions légales</a>
            <a href="#" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>Politique de confidentialité</a>
            <a href="#" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem' }}>CGU</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
