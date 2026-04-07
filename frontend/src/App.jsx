import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Reservation from './pages/Reservation';
import BookingPage from './pages/BookingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import MentionsLegales from './pages/MentionsLegales';
import PolitiqueRGPD from './pages/PolitiqueRGPD';
import { AuthProvider, useAuth } from './services/auth';
import CursorEffect from './animations/CursorEffect';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}

// Route protégée — tout utilisateur authentifié
function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

// Route protégée — admins uniquement
function AdminRoute({ children }) {
  const { token, driver } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (driver?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

// Route protégée — chauffeurs uniquement (non-admin)
function DriverRoute({ children }) {
  const { token, driver } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (driver?.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
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
          {/* ── Pages publiques ───────────────────────────────────────── */}
          <Route path="/" element={<AppLayout><Home /></AppLayout>} />
          <Route path="/reservation" element={<AppLayout><Reservation /></AppLayout>} />
          <Route path="/book/:slug" element={<AppLayout><BookingPage /></AppLayout>} />
          <Route path="/login" element={<AppLayout><Login /></AppLayout>} />
          <Route path="/register" element={<AppLayout><Register /></AppLayout>} />
          <Route path="/mentions-legales" element={<AppLayout><MentionsLegales /></AppLayout>} />
          <Route path="/politique-rgpd" element={<AppLayout><PolitiqueRGPD /></AppLayout>} />

          {/* ── Espace chauffeur ──────────────────────────────────────── */}
          <Route
            path="/dashboard"
            element={
              <DriverRoute>
                <Dashboard />
              </DriverRoute>
            }
          />

          {/* ── Espace administrateur ─────────────────────────────────── */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
