import Seo from '../components/Seo';
import MentionsLegalesContent from '../components/legal/MentionsLegalesContent';
import { LEGAL_DOCUMENTS } from '../components/legal/legalDocuments';

// Page canonique des mentions légales. Le contenu est partagé avec la modale
// ouverte depuis le footer (LCEN art. 6-III : l'URL reste directement
// accessible, y compris sans JavaScript et pour l'indexation).
const { intro } = LEGAL_DOCUMENTS['mentions-legales'];

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
            <p className="section-subtitle">{intro}</p>
          </div>

          <MentionsLegalesContent />

        </div>
      </section>
    </>
  );
}
