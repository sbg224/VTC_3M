import { useState, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { gsap } from '../animations/gsap';
import { useGsapInit } from '../animations/useGsapInit';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);

  // Animation d'entrée : uniquement les items internes (jamais le nav entier)
  // On anime en "to" depuis un état CSS pour éviter le flash opacity:0
  useGsapInit(() => {
    const nav = navRef.current;
    if (!nav) return;
    const items = nav.querySelectorAll('.navbar-nav li, .navbar-logo');
    // Positionne les items avant l'animation sans toucher à opacity
    gsap.set(items, { y: -16 });
    gsap.to(items, {
      y: 0, duration: 0.45, stagger: 0.06, ease: 'power2.out', delay: 0.1,
      clearProps: 'transform', // nettoie will-change après l'animation
    });
  }, []);
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav className="navbar" ref={navRef}>
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
          <div className="navbar-logo-icon">3M</div>
          3M Drive
        </Link>

        <ul className={`navbar-nav ${menuOpen ? 'open' : ''}`}>
          <li>
            <NavLink to="/" end onClick={() => setMenuOpen(false)}
              className={({ isActive }) => isActive ? 'active' : ''}>
              Accueil
            </NavLink>
          </li>
          <li>
            <NavLink to="/reservation" onClick={() => setMenuOpen(false)}
              className={({ isActive }) => isActive ? 'active' : ''}>
              Réservation
            </NavLink>
          </li>
          {token ? (
            <>
              <li>
                <NavLink to="/dashboard" onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => isActive ? 'active' : ''}>
                  Tableau de bord
                </NavLink>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  style={{
                    background: 'none', border: '2px solid rgba(255,255,255,0.3)',
                    color: 'rgba(255,255,255,0.8)', padding: '8px 16px',
                    borderRadius: '8px', cursor: 'pointer', fontWeight: '500',
                    fontSize: '0.95rem', transition: 'all 0.25s',
                  }}
                  onMouseOver={e => { e.target.style.borderColor = '#ef4444'; e.target.style.color = '#ef4444'; }}
                  onMouseOut={e => { e.target.style.borderColor = 'rgba(255,255,255,0.3)'; e.target.style.color = 'rgba(255,255,255,0.8)'; }}
                >
                  Déconnexion
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink to="/login" onClick={() => setMenuOpen(false)}
                  className={({ isActive }) => `${isActive ? 'active' : ''}`}>
                  Espace chauffeur
                </NavLink>
              </li>
              <li>
                <NavLink to="/reservation" className="navbar-cta" onClick={() => setMenuOpen(false)}>
                  Réserver maintenant
                </NavLink>
              </li>
            </>
          )}
        </ul>

        <button className="navbar-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span style={{ transform: menuOpen ? 'rotate(45deg) translateY(7px)' : 'none', transition: '0.25s' }}></span>
          <span style={{ opacity: menuOpen ? 0 : 1, transition: '0.25s' }}></span>
          <span style={{ transform: menuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none', transition: '0.25s' }}></span>
        </button>
      </div>
    </nav>
  );
}
