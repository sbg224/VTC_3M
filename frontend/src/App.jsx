import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import { AuthProvider, useAuth } from './services/auth';

// Purement décoratif (curseur personnalisé), sans rien de critique au premier
// rendu (voir CursorEffect.jsx) : chargé en différé pour ne pas forcer gsap
// dans le bundle initial de TOUTES les pages (login, dashboard, admin…) qui
// n'en ont pas besoin.
const CursorEffect = lazy(() => import('./animations/CursorEffect'));

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

// Le token vit dans un cookie httpOnly (invisible au JS) : tant que la
// vérification initiale de session (/api/auth/me) n'est pas terminée, on ne
// sait pas encore si l'utilisateur est connecté — éviter de rediriger vers
// /login par erreur pendant ce court instant.
function RouteFallback() {
  return (
    <div className="route-fallback" style={{ background: 'linear-gradient(135deg, #050508 0%, #111118 60%, #1a1a2e 100%)' }}>
      <div style={{ color: 'rgba(255,255,255,0.78)', fontSize: '0.95rem' }}>Chargement…</div>
    </div>
  );
}

// Route protégée — tout utilisateur authentifié
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <RouteFallback />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Route protégée — admins uniquement
function AdminRoute({ children }) {
  const { isAuthenticated, loading, driver } = useAuth();
  if (loading) return <RouteFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (driver?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

// Route protégée — chauffeurs uniquement (non-admin)
function DriverRoute({ children }) {
  const { isAuthenticated, loading, driver } = useAuth();
  if (loading) return <RouteFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (driver?.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
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
        <Suspense fallback={null}>
          <CursorEffect />
        </Suspense>
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
