import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-gold-bar"></div>
      <div className="container" style={{ paddingTop: '3rem' }}>
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="flex items-center gap-3 mb-3">
              <img src="/images/logo-3m-new.svg" alt="Logo 3M Drive" style={{ width: 44, height: 44, objectFit: 'contain' }} />
              <h3 style={{ margin: 0, color: 'var(--color-accent)' }}>3M Drive</h3>
            </div>
            <p>
              Votre chauffeur VTC privé à Toulouse. Service premium,
              discret et ponctuel pour tous vos déplacements en Haute-Garonne.
            </p>
            <div className="footer-social-list">
              {[
                { Icon: MapPin,  href: '#contact', label: 'Aller à la section contact' },
                { Icon: Phone,   href: 'tel:+33751044407', label: 'Appeler le +33 7 51 04 44 07' },
                { Icon: Mail,    href: 'mailto:3m.services31@gmail.com', label: 'Envoyer un email à 3m.services31@gmail.com' },
              ].map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  aria-label={item.label}
                  className="footer-social-link"
                  style={{ background: 'rgba(212,175,55,0.15)', color: 'rgba(255,255,255,0.7)' }}
                >
                  <item.Icon size={16} strokeWidth={1.5} />
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
              <li>
                <a href="tel:+33751044407" className="flex items-center gap-2">
                  <Phone size={13} strokeWidth={1.5} /> +33 7 51 04 44 07
                </a>
              </li>
              <li>
                <a href="mailto:3m.services31@gmail.com" className="flex items-center gap-2">
                  <Mail size={13} strokeWidth={1.5} /> 3m.services31@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
                <MapPin size={13} strokeWidth={1.5} /> Toulouse, Haute-Garonne (31)
              </li>
              <li style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '8px' }}>
                Disponible 7j/7 – 24h/24
              </li>
            </ul>
          </div>
        </div>

        <hr className="footer-divider" />

        <div className="footer-bottom">
          <span>© {year} 3M Drive – Toulouse. Tous droits réservés.</span>
          <span className="flex gap-5">
            <Link to="/mentions-legales" className="text-white/40 text-[0.82rem]">Mentions légales</Link>
            <Link to="/cgu" className="text-white/40 text-[0.82rem]">CGU</Link>
            <Link to="/politique-rgpd" className="text-white/40 text-[0.82rem]">Politique de confidentialité</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
