import { Mail, Phone, MapPin } from 'lucide-react';
import Seo from '../components/Seo';
import { CONTACT_EMAIL, CONTACT_PHONE_E164, CONTACT_PHONE_DISPLAY } from '../utils/contact';

const BREADCRUMB_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  'itemListElement': [
    { '@type': 'ListItem', 'position': 1, 'name': 'Accueil', 'item': 'https://3mdrive.fr/' },
    { '@type': 'ListItem', 'position': 2, 'name': 'Mentions légales', 'item': 'https://3mdrive.fr/mentions-legales' },
  ],
});

export default function MentionsLegales() {
  return (
    <>
    <Seo
      title="Mentions légales | 3M Drive Toulouse"
      description="Consultez les mentions légales de 3M Drive, service de chauffeur VTC à Toulouse."
      canonicalPath="/mentions-legales"
    />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: BREADCRUMB_LD }} />
    <section className="section legal-page">
      <div className="container legal-container">

        <div className="legal-header">
          <h1 className="section-title">
            Mentions <span className="gold-accent">légales</span>
          </h1>
          <p className="section-subtitle">
            Conformément aux articles 6-III et 19 de la Loi n° 2004-575 du 21 juin 2004
            pour la Confiance dans l'Économie Numérique (LCEN).
          </p>
        </div>

        <div className="legal-body">

          {/* 1 – Éditeur du site */}
          <div className="legal-section">
            <h2 className="legal-h2">1. Éditeur du site</h2>
            <p>Le présent site est édité par :</p>
            <ul className="legal-list">
              <li><strong>Raison sociale :</strong> AHADI Services</li>
              <li><strong>Nom commercial :</strong> 3M Drive</li>
              <li><strong>Forme juridique :</strong> Société par Actions Simplifiée (société à associé unique)</li>
              <li><strong>Capital social :</strong> 500,00 euros</li>
              <li><strong>SIREN :</strong> 108 767 393</li>
              <li><strong>SIRET (établissement principal) :</strong> 108 767 393 00011</li>
              <li><strong>RCS :</strong> 108 767 393 R.C.S. Toulouse</li>
              <li><strong>N° de TVA intracommunautaire :</strong> FR11 108767393</li>
              <li><strong>Code APE :</strong> 4932Z — Transports de voyageurs par taxis</li>
              <li><strong>Siège social :</strong> 1 rue Virginia Woolf, 31200 Toulouse, France</li>
              <li><strong>Représentant légal / Directeur de la publication :</strong> Mohamed Sanoussy Bah, Président</li>
              <li><strong>Email :</strong>{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="legal-link">
                  {CONTACT_EMAIL}
                </a>
              </li>
              <li><strong>Téléphone :</strong>{' '}
                <a href={`tel:${CONTACT_PHONE_E164}`} className="legal-link">
                  {CONTACT_PHONE_DISPLAY}
                </a>
              </li>
              <li><strong>Activité principale :</strong> Voiture de Transport avec Chauffeur (VTC)</li>
            </ul>
          </div>

          {/* 2 – Hébergement */}
          <div className="legal-section">
            <h2 className="legal-h2">2. Hébergement</h2>
            <p>
              Ce site est hébergé par un prestataire tiers. Les coordonnées exactes de
              l'hébergeur sont disponibles sur demande à l'adresse{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="legal-link">
                {CONTACT_EMAIL}
              </a>.
            </p>
          </div>

          {/* 3 – Propriété intellectuelle */}
          <div className="legal-section">
            <h2 className="legal-h2">3. Propriété intellectuelle</h2>
            <p>
              L'ensemble du contenu de ce site — textes, images, graphismes, logo, icônes,
              sons et logiciels — est la propriété exclusive d'AHADI Services, sauf mention
              contraire. Toute reproduction, distribution, modification, adaptation,
              retransmission ou publication de ces éléments est strictement interdite sans
              l'accord écrit préalable d'AHADI Services.
            </p>
            <p>
              Le non-respect de cette disposition constitue une contrefaçon pouvant engager
              la responsabilité civile et pénale du contrefacteur.
            </p>
          </div>

          {/* 4 – Responsabilité */}
          <div className="legal-section">
            <h2 className="legal-h2">4. Limitation de responsabilité</h2>
            <p>
              3M Drive met tout en œuvre pour offrir aux utilisateurs des informations
              disponibles et vérifiées. Toutefois, l'éditeur ne pourra être tenu responsable
              des erreurs, omissions ou indisponibilités du service.
            </p>
            <p>
              Les informations présentes sur ce site sont fournies à titre indicatif. 3M Drive
              se réserve le droit de modifier à tout moment les contenus sans préavis.
            </p>
          </div>

          {/* 5 – Données personnelles */}
          <div className="legal-section">
            <h2 className="legal-h2">5. Données personnelles</h2>
            <p>
              Le traitement des données personnelles collectées via ce site est régi par
              notre{' '}
              <a href="/politique-rgpd" className="legal-link">
                Politique de confidentialité et RGPD
              </a>
              , conformément au Règlement (UE) 2016/679 du 27 avril 2016
              (Règlement Général sur la Protection des Données).
            </p>
          </div>

          {/* 6 – Cookies */}
          <div className="legal-section">
            <h2 className="legal-h2">6. Cookies</h2>
            <p>
              Ce site peut utiliser des cookies techniques strictement nécessaires au bon
              fonctionnement du service (session, préférences). Aucun cookie publicitaire ou
              de traçage tiers n'est déposé sans consentement préalable.
            </p>
          </div>

          {/* 7 – Droit applicable */}
          <div className="legal-section">
            <h2 className="legal-h2">7. Droit applicable et juridiction</h2>
            <p>
              Tout litige en relation avec l'utilisation du site est soumis au droit français.
              En cas de différend et à défaut de résolution amiable, les tribunaux compétents
              sont ceux du ressort du Tribunal Judiciaire de Toulouse.
            </p>
          </div>

          {/* 8 – Contact */}
          <div className="legal-section legal-section--contact">
            <h2 className="legal-h2">8. Contact</h2>
            <p>Pour toute question relative aux présentes mentions légales :</p>
            <div className="legal-contact-block">
              <div className="legal-contact-item">
                <Mail size={16} strokeWidth={1.5} className="legal-contact-icon" />
                <a href={`mailto:${CONTACT_EMAIL}`} className="legal-link">
                  {CONTACT_EMAIL}
                </a>
              </div>
              <div className="legal-contact-item">
                <Phone size={16} strokeWidth={1.5} className="legal-contact-icon" />
                <a href={`tel:${CONTACT_PHONE_E164}`} className="legal-link">
                  {CONTACT_PHONE_DISPLAY}
                </a>
              </div>
              <div className="legal-contact-item">
                <MapPin size={16} strokeWidth={1.5} className="legal-contact-icon" />
                <span>1 rue Virginia Woolf, 31200 Toulouse</span>
              </div>
            </div>
          </div>

          <p className="legal-update">
            Dernière mise à jour : mars 2026
          </p>

        </div>
      </div>
    </section>
    </>
  );
}
