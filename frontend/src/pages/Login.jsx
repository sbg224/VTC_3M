import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, LogIn, Lock } from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuth } from '../services/auth';
import Seo from '../components/Seo';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Email et mot de passe requis.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      login(data.token, data.driver);
      navigate(data.driver?.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      if (!err.response) {
        setError('Impossible de joindre le serveur. Vérifiez que l\'application est bien démarrée.');
      } else if (err.response.status === 401) {
        setError('Email ou mot de passe incorrect.');
      } else if (err.response.status === 403) {
        setError(err.response?.data?.error || 'Accès refusé pour ce compte.');
      } else if (err.response.status === 429) {
        setError('Trop de tentatives. Réessayez dans quelques minutes.');
      } else {
        setError(err.response?.data?.error || 'Erreur lors de la connexion.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Seo
        title="Connexion espace chauffeur | 3M Drive"
        description="Connexion à l'espace chauffeur 3M Drive."
        canonicalPath="/login"
        noindex
      />
      <div className="login-card">
        <div className="login-card-header">
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
            <img src="/images/logo-3m-new.svg" alt="Logo 3M Drive" style={{ width: 64, height: 64, objectFit: 'contain' }} />
          </div>
          <h2>Espace Chauffeur</h2>
          <p>Connectez-vous à votre tableau de bord</p>
        </div>
        <div className="login-card-body">
          {error && (
            <div className="alert alert-error flex items-center gap-2">
              <AlertCircle size={15} strokeWidth={1.5} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">Adresse email <span>*</span></label>
              <input
                type="email" name="email"
                className="form-control"
                value={form.email} onChange={handleChange}
                placeholder="votre@email.fr"
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe <span>*</span></label>
              <input
                type="password" name="password"
                className="form-control"
                value={form.password} onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary flex items-center justify-center gap-2"
              style={{ width: '100%', marginTop: '8px' }}
              disabled={loading}
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Connexion...</>
                : <><LogIn size={15} strokeWidth={1.5} /> Se connecter</>}
            </button>
          </form>

          <div className="login-info-box"
            style={{
              marginTop: '24px', padding: '12px 16px',
              background: 'var(--color-light)', borderRadius: 'var(--radius)',
              fontSize: '0.82rem', color: 'var(--color-gray)',
            }}>
            <Lock size={13} strokeWidth={1.5} /> Accès réservé au chauffeur autorisé
          </div>

          <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-gray)' }}>
            Pas encore de compte ?{' '}
            <Link to="/register" style={{ color: 'var(--color-accent)', fontWeight: '600', textDecoration: 'none' }}>
              Créer mon espace gratuit
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
