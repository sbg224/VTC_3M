import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('vtc_token'));
  const [driver, setDriver] = useState(() => {
    const d = localStorage.getItem('vtc_driver');
    return d ? JSON.parse(d) : null;
  });

  // Rafraîchir le profil depuis /api/auth/me à chaque démarrage.
  // Si le token est révoqué (blacklisté), le /me retourne 401 → déconnexion propre.
  useEffect(() => {
    const storedToken = localStorage.getItem('vtc_token');
    if (!storedToken) return;
    axios
      .get('/api/auth/me', { headers: { Authorization: `Bearer ${storedToken}` } })
      .then(({ data }) => {
        const fresh = data.driver;
        setDriver(fresh);
        localStorage.setItem('vtc_driver', JSON.stringify(fresh));
      })
      .catch(() => {
        // Token invalide, expiré ou révoqué → déconnexion silencieuse
        localStorage.removeItem('vtc_token');
        localStorage.removeItem('vtc_driver');
        setToken(null);
        setDriver(null);
      });
  }, []);

  const login = (newToken, newDriver) => {
    localStorage.setItem('vtc_token', newToken);
    localStorage.setItem('vtc_driver', JSON.stringify(newDriver));
    setToken(newToken);
    setDriver(newDriver);
  };

  // Logout : révoque le token côté serveur (blacklist) AVANT de vider le localStorage.
  // Même si l'appel API échoue (offline, token déjà expiré), la déconnexion locale s'effectue.
  const logout = async () => {
    const storedToken = localStorage.getItem('vtc_token');
    if (storedToken) {
      try {
        await axios.post(
          '/api/auth/logout',
          {},
          { headers: { Authorization: `Bearer ${storedToken}` } }
        );
      } catch {
        // Non-bloquant — on déconnecte quoi qu'il arrive côté client
      }
    }
    localStorage.removeItem('vtc_token');
    localStorage.removeItem('vtc_driver');
    setToken(null);
    setDriver(null);
  };

  return (
    <AuthContext.Provider value={{ token, driver, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
