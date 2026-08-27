import Seo from '../components/Seo';
import ConditionsGeneralesContent from '../components/legal/ConditionsGeneralesContent';
import { LEGAL_DOCUMENTS } from '../components/legal/legalDocuments';

// Page canonique des CGU. Le contenu est partagé avec la modale ouverte depuis
// le footer et les formulaires (voir legalDocuments.js).
const { intro } = LEGAL_DOCUMENTS.cgu;

const BREADCRUMB_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://3mdrive.fr/' },
    { '@type': 'ListItem', position: 2, name: 'CGU', item: 'https://3mdrive.fr/cgu' },
  ],
});

export default function ConditionsGenerales() {
  return (
    <>
      <Seo
        title="Conditions générales d'utilisation | 3M Drive"
        description="Consultez les conditions générales d'utilisation du site 3M Drive, service de réservation VTC à Toulouse."
        canonicalPath="/cgu"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: BREADCRUMB_LD }} />
      <section className="section legal-page">
        <div className="container legal-container">

          <div className="legal-header">
            <h1 className="section-title">
              Conditions générales <span className="gold-accent">d'utilisation</span>
            </h1>
            <p className="section-subtitle">{intro}</p>
          </div>

          <ConditionsGeneralesContent />

        </div>
      </section>
    </>
  );
}
