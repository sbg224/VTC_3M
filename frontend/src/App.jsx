import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}
import Footer from './components/Footer';
import Home from './pages/Home';
import Reservation from './pages/Reservation';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MentionsLegales from './pages/MentionsLegales';
import PolitiqueRGPD from './pages/PolitiqueRGPD';
import { AuthProvider, useAuth } from './services/auth';
import CursorEffect from './animations/CursorEffect';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <CursorEffect />
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<AppLayout><Home /></AppLayout>} />
          <Route path="/reservation" element={<AppLayout><Reservation /></AppLayout>} />
          <Route path="/login" element={<AppLayout><Login /></AppLayout>} />
          <Route path="/mentions-legales" element={<AppLayout><MentionsLegales /></AppLayout>} />
          <Route path="/politique-rgpd" element={<AppLayout><PolitiqueRGPD /></AppLayout>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
