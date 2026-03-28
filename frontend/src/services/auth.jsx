import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('vtc_token'));
  const [driver, setDriver] = useState(() => {
    const d = localStorage.getItem('vtc_driver');
    return d ? JSON.parse(d) : null;
  });

  const login = (token, driver) => {
    localStorage.setItem('vtc_token', token);
    localStorage.setItem('vtc_driver', JSON.stringify(driver));
    setToken(token);
    setDriver(driver);
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
