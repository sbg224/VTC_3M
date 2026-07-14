import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, CalendarDays, User, LayoutDashboard, Send, LogOut, Sun, Moon, Menu, X } from 'lucide-react';
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const closeMobile = () => setMobileOpen(false);

  const navItemClass = ({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`;
  const mobileItemClass = ({ isActive }) => `mobile-nav-link${isActive ? ' active' : ''}`;

  // Chaque icône s'anime indépendamment à l'ouverture (delay manuel croissant).
  // Pas d'exit par icône : AnimatePresence doit attendre la fin de l'exit de
  // CHAQUE enfant animé avant de démonter le panneau — avec 5 enfants + le
  // panneau lui-même, ça peut rester bloqué en l'air. Le fondu du panneau
  // parent suffit visuellement à la fermeture.
  const mobileItemMotion = (i) => ({
    initial: { opacity: 0, x: 14 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.28, delay: i * 0.035, ease: [0.16, 1, 0.3, 1] } },
  });

  return (
    <>
      {/* ── Barre mobile compacte : logo + burger ─────────────────────────────── */}
      <div className="mobile-top-bar">
        <NavLink to="/" end className="mobile-top-bar-logo" onClick={closeMobile}>
          <img src="/images/logo-3m-new.svg" alt="Logo 3M Drive" />
          <span>3M Drive</span>
        </NavLink>
        <button
          className="mobile-top-bar-burger"
          onClick={() => setMobileOpen(o => !o)}
          aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={22} strokeWidth={1.75} /> : <Menu size={22} strokeWidth={1.75} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="mobile-nav-backdrop"
              className="mobile-nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.2 } }}
              exit={{ opacity: 0, transition: { duration: 0.16 } }}
              onClick={closeMobile}
            />
            <motion.nav
              key="mobile-nav-panel"
              className="mobile-nav-panel"
              aria-label="Navigation mobile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.2 } }}
              exit={{ opacity: 0, transition: { duration: 0.16 } }}
            >
              <motion.div {...mobileItemMotion(0)}>
                <NavLink to="/" end className={mobileItemClass} onClick={closeMobile} aria-label="Accueil" title="Accueil">
                  <Home size={19} strokeWidth={1.75} />
                </NavLink>
              </motion.div>
              <motion.div {...mobileItemMotion(1)}>
                <NavLink to="/reservation" className={mobileItemClass} onClick={closeMobile} aria-label="Réservation" title="Réservation">
                  <CalendarDays size={19} strokeWidth={1.75} />
                </NavLink>
              </motion.div>
              {token ? (
                <>
                  <motion.div {...mobileItemMotion(2)}>
                    <NavLink to="/dashboard" className={mobileItemClass} onClick={closeMobile} aria-label="Tableau de bord" title="Tableau de bord">
                      <LayoutDashboard size={19} strokeWidth={1.75} />
                    </NavLink>
                  </motion.div>
                  <motion.button
                    {...mobileItemMotion(3)}
                    onClick={handleLogout}
                    className="mobile-nav-link logout"
                    aria-label="Déconnexion"
                    title="Déconnexion"
                  >
                    <LogOut size={19} strokeWidth={1.75} />
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.div {...mobileItemMotion(2)}>
                    <NavLink to="/login" className={mobileItemClass} onClick={closeMobile} aria-label="Espace chauffeur" title="Espace chauffeur">
                      <User size={19} strokeWidth={1.75} />
                    </NavLink>
                  </motion.div>
                  <motion.div {...mobileItemMotion(3)}>
                    <NavLink to="/reservation" className="mobile-nav-link cta" onClick={closeMobile} aria-label="Réserver" title="Réserver">
                      <Send size={17} strokeWidth={1.75} />
                    </NavLink>
                  </motion.div>
                </>
              )}
              <motion.button
                {...mobileItemMotion(4)}
                className="mobile-nav-link"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
                title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              >
                {theme === 'dark' ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
              </motion.button>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* ── Pill flottante — desktop uniquement ────────────────────────────────── */}
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
    </>
  );
}
