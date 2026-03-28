import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../services/auth';

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
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Identifiants incorrects.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card-header">
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🚗</div>
          <h2>Espace Chauffeur</h2>
          <p>Connectez-vous à votre tableau de bord</p>
        </div>
        <div className="login-card-body">
          {error && <div className="alert alert-error">🚫 {error}</div>}

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
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px' }}
              disabled={loading}
            >
              {loading ? '⏳ Connexion...' : '🔑 Se connecter'}
            </button>
          </form>

          <div style={{
            marginTop: '24px', padding: '12px 16px',
            background: 'var(--color-light)', borderRadius: 'var(--radius)',
            fontSize: '0.82rem', color: 'var(--color-gray)', textAlign: 'center',
          }}>
            🔒 Accès réservé au chauffeur autorisé
          </div>
        </div>
      </div>
    </div>
  );
}
