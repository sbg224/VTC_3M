import Seo from '../components/Seo';
import PolitiqueRGPDContent from '../components/legal/PolitiqueRGPDContent';
import { LEGAL_DOCUMENTS } from '../components/legal/legalDocuments';

// Page canonique de la politique de confidentialité. Le contenu est partagé
// avec la modale ouverte depuis le footer et les cases de consentement des
// formulaires (voir legalDocuments.js).
const { intro } = LEGAL_DOCUMENTS['politique-rgpd'];

const BREADCRUMB_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  'itemListElement': [
    { '@type': 'ListItem', 'position': 1, 'name': 'Accueil', 'item': 'https://3mdrive.fr/' },
    { '@type': 'ListItem', 'position': 2, 'name': 'Politique de confidentialité', 'item': 'https://3mdrive.fr/politique-rgpd' },
  ],
});

export default function PolitiqueRGPD() {
  return (
    <>
      <Seo
        title="Politique de confidentialité et RGPD | 3M Drive"
        description="Politique de confidentialité et traitement des données personnelles de 3M Drive, chauffeur VTC à Toulouse."
        canonicalPath="/politique-rgpd"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: BREADCRUMB_LD }} />
      <section className="section legal-page">
        <div className="container legal-container">

          <div className="legal-header">
            <h1 className="section-title">
              Politique de confidentialité <span className="gold-accent">&amp; RGPD</span>
            </h1>
            <p className="section-subtitle">{intro}</p>
          </div>

          <PolitiqueRGPDContent />

        </div>
      </section>
    </>
  );
}
