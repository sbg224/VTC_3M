import { useState, useEffect } from 'react';
import { IdCard, X, Loader2, Save, Upload, Copy, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { contactAdminAPI } from '../../services/api';

const EMPTY_CONTACT_FORM = {
  firstName: '', lastName: '', company: '', jobTitle: '', shortDescription: '',
  phone: '', email: '', website: '', address: '', bookingUrl: '', isPublic: false,
};

export default function ContactModal({ contactId, onClose, onSaved }) {
  // Stable pour toute la durée de vie du modal : détermine s'il faut charger
  // un contact existant. Ne pas confondre avec `isPersisted` ci-dessous, qui
  // évolue dès la première création réussie (pour éviter qu'un second clic
  // sur "Créer la carte" ne duplique le contact).
  const openedAsNew = contactId === 'new';
  const [form, setForm]       = useState(EMPTY_CONTACT_FORM);
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(!openedAsNew);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const isPersisted = !!contact;

  useEffect(() => {
    if (openedAsNew) return;
    contactAdminAPI.getOne(contactId)
      .then(({ data }) => {
        setContact(data.contact);
        setForm({
          firstName: data.contact.firstName || '', lastName: data.contact.lastName || '',
          company: data.contact.company || '', jobTitle: data.contact.jobTitle || '',
          shortDescription: data.contact.shortDescription || '', phone: data.contact.phone || '',
          email: data.contact.email || '', website: data.contact.website || '',
          address: data.contact.address || '', bookingUrl: data.contact.bookingUrl || '',
          isPublic: !!data.contact.isPublic,
        });
      })
      .catch(() => setError('Impossible de charger cette carte de visite.'))
      .finally(() => setLoading(false));
  }, [contactId, openedAsNew]);

  const handleChange = (field) => (e) => {
    const value = field === 'isPublic' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('Prénom et nom sont requis.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (!isPersisted) {
        const { data } = await contactAdminAPI.create(form);
        setContact(data.contact); // reste ouvert sur la fiche créée pour permettre l'upload photo tout de suite
        onSaved?.();
      } else {
        const { data } = await contactAdminAPI.update(contact.id, form);
        setContact(data.contact);
        onSaved?.();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPhoto = async () => {
    if (!photoFile || !contact) return;
    setUploading(true);
    setError('');
    try {
      const { data } = await contactAdminAPI.uploadPhoto(contact.id, photoFile);
      setContact(data.contact);
      setPhotoFile(null);
      onSaved?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de l\'upload de la photo.');
    } finally {
      setUploading(false);
    }
  };

  const publicUrl = contact?.slug ? `${window.location.origin}/contact/${contact.slug}` : null;

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <motion.div
        className="adm-modal"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.22 }}
      >
        <div className="adm-modal-header">
          <h3><IdCard size={17} strokeWidth={1.75} /> {isPersisted ? 'Modifier la carte' : 'Nouvelle carte de visite'}</h3>
          <button className="adm-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}><Loader2 size={28} className="animate-spin" style={{ color: '#267253' }} /></div>
        ) : (
          <div className="adm-modal-body">
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '10px 14px', borderRadius: 10, fontSize: '0.82rem', marginBottom: 14 }}>
                {error}
              </div>
            )}

            <div className="adm-cardform-grid">
              <input type="text" className="adm-input" placeholder="Prénom *" value={form.firstName} onChange={handleChange('firstName')} />
              <input type="text" className="adm-input" placeholder="Nom *" value={form.lastName} onChange={handleChange('lastName')} />
              <input type="text" className="adm-input" placeholder="Société" value={form.company} onChange={handleChange('company')} />
              <input type="text" className="adm-input" placeholder="Fonction" value={form.jobTitle} onChange={handleChange('jobTitle')} />
            </div>
            <textarea
              className="adm-input" rows={2} placeholder="Description courte" style={{ resize: 'vertical', marginTop: 10 }}
              value={form.shortDescription} onChange={handleChange('shortDescription')}
            />
            <div className="adm-cardform-grid" style={{ marginTop: 10 }}>
              <input type="text" className="adm-input" placeholder="Téléphone" value={form.phone} onChange={handleChange('phone')} />
              <input type="email" className="adm-input" placeholder="Email" value={form.email} onChange={handleChange('email')} />
              <input type="text" className="adm-input" placeholder="Site web (https://…)" value={form.website} onChange={handleChange('website')} />
              <input type="text" className="adm-input" placeholder="URL de réservation (facultatif)" value={form.bookingUrl} onChange={handleChange('bookingUrl')} />
            </div>
            <input
              type="text" className="adm-input" placeholder="Adresse professionnelle" style={{ marginTop: 10 }}
              value={form.address} onChange={handleChange('address')}
            />

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, cursor: 'pointer', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
              <input type="checkbox" checked={form.isPublic} onChange={handleChange('isPublic')} style={{ width: 16, height: 16 }} />
              Rendre cette carte publique (opt-in — invisible tant que non coché)
            </label>

            <button className="adm-btn-primary" style={{ marginTop: 16 }} disabled={saving} onClick={handleSave}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} strokeWidth={2} />}
              {isPersisted ? 'Enregistrer les modifications' : 'Créer la carte'}
            </button>

            {/* Photo + lien public — uniquement une fois le contact créé */}
            {contact && (
              <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Photo</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {contact.photoUrl && (
                    <img src={contact.photoUrl} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                  )}
                  <input
                    type="file" accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}
                  />
                  <button className="adm-btn-icon" disabled={!photoFile || uploading} onClick={handleUploadPhoto} title="Uploader">
                    {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                  </button>
                </div>

                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', margin: '18px 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lien public</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <code style={{ fontSize: '0.8rem', color: '#267253', background: 'rgba(38,114,83,0.1)', padding: '6px 10px', borderRadius: 8, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    /contact/{contact.slug}
                  </code>
                  <button className="adm-btn-icon" title="Copier le lien" onClick={() => navigator.clipboard?.writeText(publicUrl)}>
                    <Copy size={14} />
                  </button>
                  <a className="adm-btn-icon" href={publicUrl} target="_blank" rel="noopener noreferrer" title="Ouvrir la carte">
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
