import Seo from '../components/Seo';

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
            <p className="section-subtitle">
              Les présentes CGU encadrent l'accès et l'utilisation du site 3M Drive,
              notamment le formulaire de réservation, l'espace chauffeur et les services associés.
            </p>
          </div>

          <div className="legal-body">
            <div className="legal-section">
              <h2 className="legal-h2">1. Objet</h2>
              <p>
                Le site 3M Drive permet aux utilisateurs de consulter les services proposés,
                d'effectuer une demande de réservation et, pour les comptes habilités,
                d'accéder à un espace sécurisé de gestion.
              </p>
            </div>

            <div className="legal-section">
              <h2 className="legal-h2">2. Acceptation</h2>
              <p>
                Toute utilisation du site implique l'acceptation pleine et entière des présentes
                conditions générales d'utilisation. L'utilisateur reconnaît également avoir pris
                connaissance des mentions légales et de la politique de confidentialité.
              </p>
            </div>

            <div className="legal-section">
              <h2 className="legal-h2">3. Réservations</h2>
              <p>
                Toute demande de réservation doit être complète, sincère et exacte. L'envoi du
                formulaire ne vaut pas automatiquement acceptation définitive de la course.
                Une confirmation opérationnelle peut être requise selon la disponibilité,
                la faisabilité et les conditions du trajet.
              </p>
            </div>

            <div className="legal-section">
              <h2 className="legal-h2">4. Responsabilités de l'utilisateur</h2>
              <p>L'utilisateur s'engage à :</p>
              <ul className="legal-list">
                <li>ne pas transmettre de fausses informations ;</li>
                <li>ne pas perturber le fonctionnement du site ;</li>
                <li>ne pas tenter d'accéder à des zones non autorisées ;</li>
                <li>utiliser les services dans un cadre licite et conforme au droit français.</li>
              </ul>
            </div>

            <div className="legal-section">
              <h2 className="legal-h2">5. Espace chauffeur / administrateur</h2>
              <p>
                Les accès authentifiés sont strictement personnels. Tout utilisateur disposant
                d'identifiants d'accès doit en assurer la confidentialité. Toute action effectuée
                depuis un compte authentifié est présumée réalisée par son titulaire jusqu'à preuve contraire.
              </p>
            </div>

            <div className="legal-section">
              <h2 className="legal-h2">6. Disponibilité du service</h2>
              <p>
                3M Drive met en œuvre les moyens raisonnables pour assurer la disponibilité du site,
                sans garantir une disponibilité continue ni l'absence totale d'erreurs ou d'interruptions.
              </p>
            </div>

            <div className="legal-section">
              <h2 className="legal-h2">7. Données personnelles</h2>
              <p>
                Le traitement des données personnelles collectées via le site est encadré par la
                politique de confidentialité et protection des données disponible sur la page dédiée.
              </p>
            </div>

            <div className="legal-section">
              <h2 className="legal-h2">8. Propriété intellectuelle</h2>
              <p>
                Les contenus, éléments graphiques, textes, interfaces et composants du site restent
                protégés par le droit de la propriété intellectuelle. Toute reproduction ou réutilisation
                non autorisée est interdite.
              </p>
            </div>

            <div className="legal-section">
              <h2 className="legal-h2">9. Droit applicable</h2>
              <p>
                Les présentes CGU sont soumises au droit français. En cas de litige,
                et à défaut de résolution amiable, les juridictions compétentes sont celles du ressort de Toulouse.
              </p>
            </div>

            <p className="legal-update">
              Dernière mise à jour : avril 2026
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
