import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, CalendarDays, User, LayoutDashboard, Send, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../services/auth';

export default function Navbar() {
  // ── Gestion du thème clair / sombre ────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('vtc_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vtc_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItemClass = ({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`;

  return (
    <nav className="bottom-nav" aria-label="Navigation principale">
      <NavLink to="/" end className={navItemClass} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <Home size={18} strokeWidth={1.75} />
        <span className="bottom-nav-label">Accueil</span>
      </NavLink>

      <NavLink to="/reservation" className={navItemClass}>
        <CalendarDays size={18} strokeWidth={1.75} />
        <span className="bottom-nav-label">Réservation</span>
      </NavLink>

      {token ? (
        <>
          <NavLink to="/dashboard" className={navItemClass}>
            <LayoutDashboard size={18} strokeWidth={1.75} />
            <span className="bottom-nav-label">Tableau de bord</span>
          </NavLink>
          <motion.button
            onClick={handleLogout}
            className="bottom-nav-item logout"
            whileTap={{ scale: 0.94 }}
            aria-label="Déconnexion"
            title="Déconnexion"
          >
            <LogOut size={18} strokeWidth={1.75} />
          </motion.button>
        </>
      ) : (
        <>
          <NavLink to="/login" className={navItemClass}>
            <User size={18} strokeWidth={1.75} />
            <span className="bottom-nav-label">Espace chauffeur</span>
          </NavLink>
          <NavLink to="/reservation" className="bottom-nav-item cta">
            <Send size={16} strokeWidth={1.75} />
            <span className="bottom-nav-label">Réserver</span>
          </NavLink>
        </>
      )}

      <div className="bottom-nav-divider" />

      <motion.button
        className="bottom-nav-icon-btn"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
        whileTap={{ scale: 0.9 }}
        title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
      >
        {theme === 'dark'
          ? <Sun size={17} strokeWidth={1.75} />
          : <Moon size={17} strokeWidth={1.75} />
        }
      </motion.button>
    </nav>
  );
}
