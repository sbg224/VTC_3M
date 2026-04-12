import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import { AuthProvider, useAuth } from './services/auth';
import CursorEffect from './animations/CursorEffect';

const Reservation = lazy(() => import('./pages/Reservation'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const MentionsLegales = lazy(() => import('./pages/MentionsLegales'));
const PolitiqueRGPD = lazy(() => import('./pages/PolitiqueRGPD'));
const ConditionsGenerales = lazy(() => import('./pages/ConditionsGenerales'));
const ReviewPage = lazy(() => import('./pages/ReviewPage'));

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

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #050508 0%, #111118 60%, #1a1a2e 100%)' }}>
      <div style={{ color: 'rgba(255,255,255,0.78)', fontSize: '0.95rem' }}>Chargement…</div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <CursorEffect />
        <ScrollToTop />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* ── Pages publiques ───────────────────────────────────────── */}
            <Route path="/" element={<AppLayout><Home /></AppLayout>} />
            <Route path="/reservation" element={<AppLayout><Reservation /></AppLayout>} />
            <Route path="/book/:slug" element={<AppLayout><BookingPage /></AppLayout>} />
            <Route path="/login" element={<AppLayout><Login /></AppLayout>} />
            <Route path="/register" element={<AppLayout><Register /></AppLayout>} />
            <Route path="/mentions-legales" element={<AppLayout><MentionsLegales /></AppLayout>} />
            <Route path="/politique-rgpd" element={<AppLayout><PolitiqueRGPD /></AppLayout>} />
            <Route path="/politique-confidentialite" element={<Navigate to="/politique-rgpd" replace />} />
            <Route path="/cgu" element={<AppLayout><ConditionsGenerales /></AppLayout>} />
            <Route path="/review/:token" element={<ReviewPage />} />

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
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
