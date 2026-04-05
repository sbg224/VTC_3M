import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, AlertCircle, Loader2, Save } from 'lucide-react';
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
      showToast('Mot de passe modifié avec succès.', 'success');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du changement.');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'currentPassword', label: 'Mot de passe actuel' },
    { name: 'newPassword',     label: 'Nouveau mot de passe' },
    { name: 'confirm',         label: 'Confirmer le nouveau mot de passe' },
  ];

  return (
    <div className="bg-[#111118] border border-white/8 rounded-2xl p-6 max-w-lg w-full">
      <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
        <Lock size={16} strokeWidth={1.5} className="text-[#D4AF37]" />
        Changer le mot de passe
      </h3>
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2 mb-5">
          <AlertCircle size={16} strokeWidth={1.5} className="text-red-400 shrink-0" />
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {fields.map(field => (
          <div key={field.name} className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-white/50 uppercase tracking-widest flex items-center gap-1.5">
              <Lock size={14} strokeWidth={1.5} />
              {field.label} *
            </label>
            <input
              type="password" name={field.name}
              className="input-dark"
              value={form[field.name]} onChange={handleChange}
              placeholder="••••••••" autoComplete="new-password"
            />
          </div>
        ))}
        <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          disabled={loading}
          className="w-full bg-white text-black font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 mt-2 disabled:opacity-50">
          {loading
            ? <><Loader2 size={16} strokeWidth={1.5} className="animate-spin" /> Enregistrement...</>
            : <><Save size={16} strokeWidth={1.5} /> Enregistrer le mot de passe</>}
        </motion.button>
      </form>
    </div>
  );
}
