import { useState } from 'react';
import { Settings, Clock, CheckCircle } from 'lucide-react';
import { authAPI } from '../../services/api';

export default function ChangePasswordForm({ showToast }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) { setError('Les mots de passe ne correspondent pas.'); return; }
    if (form.newPassword.length < 8) { setError('Le mot de passe doit faire au moins 8 caractères.'); return; }
    setLoading(true);
    try {
      await authAPI.changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      showToast('Mot de passe modifié avec succès.');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du changement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '480px' }}>
      <div className="card-header"><h3 style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}><Settings size={16} strokeWidth={1.5} /> Changer le mot de passe</h3></div>
      <div className="card-body">
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          {[
            { name: 'currentPassword', label: 'Mot de passe actuel' },
            { name: 'newPassword', label: 'Nouveau mot de passe' },
            { name: 'confirm', label: 'Confirmer le nouveau mot de passe' },
          ].map(field => (
            <div key={field.name} className="form-group">
              <label className="form-label">{field.label} *</label>
              <input
                type="password" name={field.name}
                className="form-control" value={form[field.name]} onChange={handleChange}
                placeholder="••••••••" autoComplete="new-password"
              />
            </div>
          ))}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? <><Clock size={14} className="animate-spin" /> ...</> : <><CheckCircle size={14} strokeWidth={1.5} /> Enregistrer</>}
          </button>
        </form>
      </div>
    </div>
  );
}
