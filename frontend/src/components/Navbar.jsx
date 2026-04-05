import { useState, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
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
                <motion.button
                  onClick={handleLogout}
                  className="flex items-center gap-2 border-2 border-white/30 text-white/80 px-4 py-2 rounded-lg font-medium text-[0.9rem] transition-colors duration-200"
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

        <button className="navbar-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span className={`transition-transform duration-250 ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`}></span>
          <span className={`transition-opacity duration-250 ${menuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
          <span className={`transition-transform duration-250 ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`}></span>
        </button>
      </div>
    </nav>
  );
}
