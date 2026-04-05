import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Car, AlertCircle, Loader2, UserPlus, Eye, EyeOff,
  CheckCircle, Clock, Zap, Shield,
} from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuth } from '../services/auth';

// ── Validation côté client (miroir des règles backend) ────────────────────────

function validateForm(form) {
  const errors = {};

  if (!form.name.trim() || form.name.trim().length < 2) {
    errors.name = 'Le nom complet est requis (min. 2 caractères).';
  }

  if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
    errors.email = 'Adresse email invalide.';
  }

  if (!form.password) {
    errors.password = 'Le mot de passe est requis.';
  } else if (form.password.length < 8) {
    errors.password = 'Minimum 8 caractères.';
  } else if (!/[A-Z]/.test(form.password)) {
    errors.password = 'Au moins une majuscule requise.';
  } else if (!/[0-9]/.test(form.password)) {
    errors.password = 'Au moins un chiffre requis.';
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'Veuillez confirmer votre mot de passe.';
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Les mots de passe ne correspondent pas.';
  }

  if (form.phone && !/^(\+33|0)[1-9](\d{8})$/.test(form.phone.replace(/\s/g, ''))) {
    errors.phone = 'Format invalide (ex: +33 6 12 34 56 78).';
  }

  return errors;
}

// ── Indicateur de force du mot de passe ───────────────────────────────────────

function PasswordStrength({ password }) {
  if (!password) return null;

  const checks = [
    { label: '8 caractères min.', ok: password.length >= 8 },
    { label: 'Une majuscule',     ok: /[A-Z]/.test(password) },
    { label: 'Un chiffre',        ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['#ef4444', '#f97316', '#22c55e'];
  const labels = ['Faible', 'Moyen', 'Fort'];

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            flex: 1, height: '3px', borderRadius: '2px',
            background: i < score ? colors[score - 1] : 'rgba(255,255,255,0.1)',
            transition: 'background 0.25s',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {checks.map(({ label, ok }) => (
          <span key={label} style={{
            fontSize: '0.72rem',
            color: ok ? '#22c55e' : 'rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', gap: '4px',
            transition: 'color 0.2s',
          }}>
            <CheckCircle size={10} strokeWidth={2} /> {label}
          </span>
        ))}
      </div>
      {score === 3 && (
        <div style={{ fontSize: '0.72rem', color: '#22c55e', marginTop: '4px', fontWeight: '600' }}>
          {labels[score - 1]}
        </div>
      )}
    </div>
  );
}

// ── Page Register ─────────────────────────────────────────────────────────────

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: '',
  });
  const [errors,     setErrors]     = useState({});
  const [serverError, setServerError] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [showPass,   setShowPass]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const errs = validateForm(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name:     form.name.trim(),
        email:    form.email.trim(),
        password: form.password,
        ...(form.phone.trim() && { phone: form.phone.trim() }),
      };
      const { data } = await authAPI.register(payload);
      login(data.token, data.driver);
      navigate('/dashboard');
    } catch (err) {
      setServerError(
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        'Une erreur est survenue. Veuillez réessayer.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: '480px' }}>

        {/* En-tête */}
        <div className="login-card-header">
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
            <Car size={40} strokeWidth={1.5} style={{ color: 'var(--color-accent)' }} />
          </div>
          <h2>Créer votre espace chauffeur</h2>
          <p>14 jours d'essai gratuit — sans carte bancaire</p>
        </div>

        {/* Avantages essai */}
        <div style={{
          margin: '0 0 20px',
          padding: '14px 20px',
          background: 'rgba(212,175,55,0.07)',
          border: '1px solid rgba(212,175,55,0.2)',
          borderRadius: '12px',
          display: 'flex', flexDirection: 'column', gap: '8px',
        }}>
          {[
            { Icon: Clock,  text: '14 jours d\'essai complet, gratuit' },
            { Icon: Zap,    text: 'Réservations, stats & factures PDF inclus' },
            { Icon: Shield, text: 'URL de réservation personnalisée (/book/votre-nom)' },
          ].map(({ Icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)' }}>
              <Icon size={13} strokeWidth={1.5} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
              {text}
            </div>
          ))}
        </div>

        {/* Formulaire */}
        <div className="login-card-body">
          {serverError && (
            <div className="alert alert-error flex items-center gap-2" style={{ marginBottom: '16px' }}>
              <AlertCircle size={15} strokeWidth={1.5} /> {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* Nom complet */}
            <div className="form-group">
              <label className="form-label">Nom complet <span>*</span></label>
              <input
                type="text" name="name"
                className={`form-control ${errors.name ? 'error' : ''}`}
                value={form.name} onChange={handleChange}
                placeholder="Jean Dupont"
                autoComplete="name" autoFocus
              />
              {errors.name && (
                <div className="form-error flex items-center gap-1" style={{ fontSize: '0.78rem', marginTop: '4px', color: 'var(--color-error)' }}>
                  <AlertCircle size={11} strokeWidth={1.5} /> {errors.name}
                </div>
              )}
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Adresse email <span>*</span></label>
              <input
                type="email" name="email"
                className={`form-control ${errors.email ? 'error' : ''}`}
                value={form.email} onChange={handleChange}
                placeholder="jean.dupont@email.fr"
                autoComplete="email"
              />
              {errors.email && (
                <div className="form-error flex items-center gap-1" style={{ fontSize: '0.78rem', marginTop: '4px', color: 'var(--color-error)' }}>
                  <AlertCircle size={11} strokeWidth={1.5} /> {errors.email}
                </div>
              )}
            </div>

            {/* Téléphone (optionnel) */}
            <div className="form-group">
              <label className="form-label">Téléphone <span style={{ color: 'var(--color-gray)', fontWeight: '400' }}>(optionnel)</span></label>
              <input
                type="tel" name="phone"
                className={`form-control ${errors.phone ? 'error' : ''}`}
                value={form.phone} onChange={handleChange}
                placeholder="+33 6 12 34 56 78"
                autoComplete="tel"
              />
              {errors.phone && (
                <div className="form-error flex items-center gap-1" style={{ fontSize: '0.78rem', marginTop: '4px', color: 'var(--color-error)' }}>
                  <AlertCircle size={11} strokeWidth={1.5} /> {errors.phone}
                </div>
              )}
            </div>

            {/* Mot de passe */}
            <div className="form-group">
              <label className="form-label">Mot de passe <span>*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} name="password"
                  className={`form-control ${errors.password ? 'error' : ''}`}
                  value={form.password} onChange={handleChange}
                  placeholder="Min. 8 car., 1 majuscule, 1 chiffre"
                  autoComplete="new-password"
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray)', padding: '4px',
                  }}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
              {errors.password && (
                <div className="form-error flex items-center gap-1" style={{ fontSize: '0.78rem', marginTop: '4px', color: 'var(--color-error)' }}>
                  <AlertCircle size={11} strokeWidth={1.5} /> {errors.password}
                </div>
              )}
            </div>

            {/* Confirmer mot de passe */}
            <div className="form-group">
              <label className="form-label">Confirmer le mot de passe <span>*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'} name="confirmPassword"
                  className={`form-control ${errors.confirmPassword ? 'error' : ''}`}
                  value={form.confirmPassword} onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gray)', padding: '4px',
                  }}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={16} strokeWidth={1.5} /> : <Eye size={16} strokeWidth={1.5} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="form-error flex items-center gap-1" style={{ fontSize: '0.78rem', marginTop: '4px', color: 'var(--color-error)' }}>
                  <AlertCircle size={11} strokeWidth={1.5} /> {errors.confirmPassword}
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary flex items-center justify-center gap-2"
              style={{ width: '100%', marginTop: '8px' }}
              disabled={loading}
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Création du compte...</>
                : <><UserPlus size={15} strokeWidth={1.5} /> Créer mon espace chauffeur</>}
            </button>
          </form>

          {/* Lien vers login */}
          <div style={{
            marginTop: '20px', textAlign: 'center',
            fontSize: '0.85rem', color: 'var(--color-gray)',
          }}>
            Déjà un compte ?{' '}
            <Link to="/login" style={{ color: 'var(--color-accent)', fontWeight: '600', textDecoration: 'none' }}>
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
