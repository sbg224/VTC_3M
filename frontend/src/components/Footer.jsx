import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-gold-bar"></div>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <img src="/images/logo-3m-new.svg" alt="Logo 3M Drive" style={{ width: 36, height: 36, objectFit: 'contain' }} />
              <h3 style={{ margin: 0 }}>3M Drive</h3>
            </div>
            <p>Votre chauffeur VTC privé à Toulouse — service premium, discret et ponctuel.</p>
            <div className="footer-contact-row">
              <a href="tel:+33751044407"><Phone size={13} strokeWidth={1.5} /> +33 7 51 04 44 07</a>
              <a href="mailto:3m.services31@gmail.com"><Mail size={13} strokeWidth={1.5} /> 3m.services31@gmail.com</a>
              <span><MapPin size={13} strokeWidth={1.5} /> Toulouse (31)</span>
            </div>
          </div>

          <div className="footer-col">
            <h4>Navigation</h4>
            <ul>
              <li><Link to="/">Accueil</Link></li>
              <li><Link to="/reservation">Réservation</Link></li>
              <li><Link to="/#contact">Contact</Link></li>
              <li><Link to="/login">Espace chauffeur</Link></li>
            </ul>
          </div>
        </div>

        <hr className="footer-divider" />

        <div className="footer-bottom">
          <span>© {year} 3M Drive – Toulouse. Tous droits réservés.</span>
          <span className="footer-legal-links">
            <Link to="/mentions-legales">Mentions légales</Link>
            <Link to="/cgu">CGU</Link>
            <Link to="/politique-rgpd">Politique de confidentialité</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
