import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('vtc_token'));
  const [driver, setDriver] = useState(() => {
    const d = localStorage.getItem('vtc_driver');
    return d ? JSON.parse(d) : null;
  });

  // Rafraîchir le profil depuis /api/auth/me à chaque démarrage
  // pour s'assurer que role, status, slug, trialEndDate sont à jour
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
        // Token invalide ou expiré → déconnexion silencieuse
        localStorage.removeItem('vtc_token');
        localStorage.removeItem('vtc_driver');
        setToken(null);
        setDriver(null);
      });
  }, []); // une seule fois au montage

  const login = (newToken, newDriver) => {
    localStorage.setItem('vtc_token', newToken);
    localStorage.setItem('vtc_driver', JSON.stringify(newDriver));
    setToken(newToken);
    setDriver(newDriver);
  };

  const logout = () => {
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
