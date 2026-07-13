import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../services/auth';
import { gsap } from '../animations/gsap';
import { useGsapInit } from '../animations/useGsapInit';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);

  // ── Gestion du thème clair / sombre ────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('vtc_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vtc_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

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
        <Link to="/" className="navbar-logo" onClick={() => { setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <img
            src="/images/logo-3m-new.svg"
            alt="3M Drive – VTC Premium Toulouse"
            style={{ height: '40px', width: '40px', objectFit: 'contain', flexShrink: 0 }}
          />
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
                <motion.button
                  onClick={handleLogout}
                  className="navbar-logout-btn"
                  whileHover={{ borderColor: '#ef4444', color: '#ef4444' }}
                  whileTap={{ scale: 0.97 }}
                >
                  <LogOut size={15} strokeWidth={1.5} />
                  Déconnexion
                </motion.button>
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

        {/* Toggle thème clair / sombre */}
        <motion.button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        >
          {theme === 'dark'
            ? <Sun size={16} strokeWidth={1.75} />
            : <Moon size={16} strokeWidth={1.75} />
          }
        </motion.button>

        <button className="navbar-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span className={`transition-transform duration-250 ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`}></span>
          <span className={`transition-opacity duration-250 ${menuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
          <span className={`transition-transform duration-250 ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`}></span>
        </button>
      </div>
    </nav>
  );
}
