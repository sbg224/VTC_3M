import { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [driver, setDriver] = useState(null);
  // true tant qu'on n'a pas confirmé l'état de la session auprès du serveur —
  // le token vit dans un cookie httpOnly, invisible au JS, donc impossible
  // de savoir "suis-je connecté ?" sans appeler l'API au moins une fois.
  const [loading, setLoading] = useState(true);

  // Vérifie la session auprès du serveur à chaque démarrage de l'app (le
  // cookie httpOnly, s'il existe, est envoyé automatiquement par le navigateur).
  useEffect(() => {
    api
      .get('/auth/me')
      .then(({ data }) => setDriver(data.driver))
      .catch(() => setDriver(null)) // pas de session valide → déconnecté
      .finally(() => setLoading(false));
  }, []);

  const login = (newDriver) => {
    setDriver(newDriver);
  };

  // Logout : révoque le token côté serveur (blacklist + efface le cookie).
  // Même si l'appel API échoue (offline), la déconnexion locale s'effectue.
  const logout = async () => {
    try {
      // Corps vide explicite : sans lui, axios n'envoie pas de Content-Type,
      // et le middleware backend qui l'exige sur tout POST/PUT rejette la
      // requête (415) — le cookie ne serait alors jamais effacé côté serveur.
      await api.post('/auth/logout', {});
    } catch {
      // Non-bloquant — on déconnecte quoi qu'il arrive côté client
    }
    setDriver(null);
  };

  return (
    <AuthContext.Provider value={{ driver, loading, isAuthenticated: !!driver, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
