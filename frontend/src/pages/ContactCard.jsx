import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import QRCode from 'react-qr-code';
import {
  Loader2, AlertTriangle, Phone, Mail, Globe, MapPin, MessageCircle,
  Download, Car, Briefcase, Building2,
} from 'lucide-react';
import { contactPublicAPI } from '../services/api';
import Seo from '../components/Seo';

// Ne suit aucune logique VTC — module réutilisable pour n'importe quelle
// personne/société liée ou non à un chauffeur (driverId optionnel).
export default function ContactCard() {
  const { slug } = useParams();

  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    contactPublicAPI.getBySlug(slug)
      .then(({ data }) => setContact(data.contact))
      .catch(() => setError('Cette carte de visite est introuvable ou n\'est plus publique.'))
      .finally(() => setLoading(false));
  }, [slug]);

  const track = (type) => {
    contactPublicAPI.trackEvent(slug, type).catch(() => {});
  };

  const initials = contact
    ? `${contact.firstName?.[0] || ''}${contact.lastName?.[0] || ''}`.toUpperCase()
    : '';

  const whatsappNumber = contact?.phone ? contact.phone.replace(/[^\d+]/g, '').replace(/^\+/, '') : '';

  if (loading) {
    return (
      <section className="contact-card-page">
        <div className="container" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
        </div>
      </section>
    );
  }

  if (error || !contact) {
    return (
      <section className="contact-card-page">
        <div className="container">
          <div className="success-card" style={{ textAlign: 'center', maxWidth: '480px', margin: '80px auto' }}>
            <AlertTriangle size={48} strokeWidth={1.5} style={{ color: 'var(--color-error)', margin: '0 auto 16px' }} />
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', marginBottom: '12px' }}>
              Carte introuvable
            </h2>
            <p style={{ color: 'var(--color-gray)', marginBottom: '24px' }}>{error}</p>
            <Link to="/" className="btn btn-primary">Retour à l'accueil</Link>
          </div>
        </div>
      </section>
    );
  }

  const publicUrl = `${window.location.origin}/contact/${slug}`;

  return (
    <section className="contact-card-page">
      <Seo
        title={`${contact.firstName} ${contact.lastName}${contact.company ? ` | ${contact.company}` : ''}`}
        description={contact.shortDescription || `Carte de visite numérique de ${contact.firstName} ${contact.lastName}`}
        canonicalPath={`/contact/${slug}`}
      />
      <div className="container">
        <div className="contact-card">
          <div className="contact-card-banner" />
          <div className="contact-card-body">
            <div className="contact-card-avatar">
              {contact.photoUrl
                ? <img src={contact.photoUrl} alt={`${contact.firstName} ${contact.lastName}`} />
                : initials}
            </div>
            <div className="contact-card-name">{contact.firstName} {contact.lastName}</div>
            {contact.jobTitle && (
              <div className="contact-card-role"><Briefcase size={13} strokeWidth={2} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '5px' }} />{contact.jobTitle}</div>
            )}
            {contact.company && (
              <div className="contact-card-company"><Building2 size={13} strokeWidth={2} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '5px' }} />{contact.company}</div>
            )}
            {contact.shortDescription && <p className="contact-card-desc">{contact.shortDescription}</p>}

            {(contact.phone || contact.email || contact.website || contact.address) && (
              <div className="contact-card-info">
                {contact.phone && <div className="contact-card-info-row"><Phone size={15} strokeWidth={1.75} />{contact.phone}</div>}
                {contact.email && <div className="contact-card-info-row"><Mail size={15} strokeWidth={1.75} />{contact.email}</div>}
                {contact.website && <div className="contact-card-info-row"><Globe size={15} strokeWidth={1.75} />{contact.website}</div>}
                {contact.address && <div className="contact-card-info-row"><MapPin size={15} strokeWidth={1.75} />{contact.address}</div>}
              </div>
            )}

            <div className="contact-card-actions">
              <a href={contactPublicAPI.vcardUrl(slug)} className="btn btn-primary btn-full" download>
                <Download size={15} strokeWidth={1.75} /> Ajouter aux contacts
              </a>

              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="btn btn-outline" onClick={() => track('click_phone')}>
                  <Phone size={14} strokeWidth={1.75} /> Appeler
                </a>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="btn btn-outline" onClick={() => track('click_email')}>
                  <Mail size={14} strokeWidth={1.75} /> E-mail
                </a>
              )}
              {contact.phone && (
                <a
                  href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer"
                  className="btn btn-outline" onClick={() => track('click_whatsapp')}
                >
                  <MessageCircle size={14} strokeWidth={1.75} /> WhatsApp
                </a>
              )}
              {contact.website && (
                <a href={contact.website} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                  <Globe size={14} strokeWidth={1.75} /> Site web
                </a>
              )}
              {contact.bookingUrl && (
                <a href={contact.bookingUrl} className="btn btn-dark btn-full" onClick={() => track('click_booking')}>
                  <Car size={14} strokeWidth={1.75} /> Réserver un trajet
                </a>
              )}
            </div>

            <div className="contact-card-qr-wrap">
              <div className="contact-card-qr-box">
                <QRCode value={publicUrl} size={120} />
              </div>
              <span className="contact-card-qr-label">Scanner pour partager cette carte</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
