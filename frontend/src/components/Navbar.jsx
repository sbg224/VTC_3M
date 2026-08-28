import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, CalendarDays, User, LayoutDashboard, Send, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../services/auth';

// Le sélecteur de thème a été retiré des pages publiques : il ne repeignait que
// 2 propriétés visibles sur 14 faute de tokens redéfinis par thème. Un mode
// sombre réellement fonctionnel est prévu pour le tableau de bord uniquement
// (voir ia/CONTEXT.md §7).
export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  const closeMobile = () => setMobileOpen(false);

  const navItemClass = ({ isActive }) => `site-header-link${isActive ? ' active' : ''}`;
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
          {/* Logotype seul (pas le symbole à côté : les deux commencent par
              "3", les combiner créait une répétition visuelle maladroite).
              Le symbole est réservé aux contextes carrés (favicon, icône
              d'app) où c'est lui qui est optimal. Variante claire/sombre
              selon le thème pour rester lisible sur la barre translucide. */}
          <img
            src="/images/nav-logo-dark.webp"
            alt="3M Drive"
            className="mobile-top-bar-wordmark"
          />
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
              {isAuthenticated ? (
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
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* ── En-tête desktop ──────────────────────────────────────────────────── */}
      <header className="site-header">
        <div className="container site-header-inner">
          <NavLink to="/" end className="site-header-logo" aria-label="3M Drive — accueil">
            <img src="/images/nav-logo-dark.webp" alt="3M Drive" className="site-header-wordmark" />
          </NavLink>

          <nav className="site-header-nav" aria-label="Navigation principale">
            <NavLink to="/" end className={navItemClass}>Accueil</NavLink>
            <NavLink to="/reservation" className={navItemClass}>Réservation</NavLink>

            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" className={navItemClass}>Tableau de bord</NavLink>
                <button type="button" className="site-header-link" onClick={handleLogout}>
                  <LogOut size={15} strokeWidth={1.75} /> Déconnexion
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navItemClass}>Espace chauffeur</NavLink>
                <NavLink to="/reservation" className="site-header-cta">
                  <Send size={14} strokeWidth={1.75} /> Réserver
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
