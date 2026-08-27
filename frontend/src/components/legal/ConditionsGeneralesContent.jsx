import { CONTACT_EMAIL, CONTACT_PHONE_E164, CONTACT_PHONE_DISPLAY } from '../../utils/contact';

// Corps des CGU, sans titre ni <Seo> : rendu à l'identique par la page /cgu
// et par la modale (voir legalDocuments.js).
export default function ConditionsGeneralesContent() {
  return (
    <div className="legal-body">
      <div className="legal-section">
        <h2 className="legal-h2">1. Identification du prestataire</h2>
        <p>
          Le site 3M Drive est édité et exploité par AHADI Services, Société par Actions
          Simplifiée à associé unique au capital de 500,00 euros, immatriculée au RCS de
          Toulouse sous le numéro 108 767 393, dont le siège social est situé
          1 rue Virginia Woolf, 31200 Toulouse, représentée par Mohamed Sanoussy Bah,
          Président.
        </p>
        <p>
          Contact :{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="legal-link">
            {CONTACT_EMAIL}
          </a>{' '}
          —{' '}
          <a href={`tel:${CONTACT_PHONE_E164}`} className="legal-link">
            {CONTACT_PHONE_DISPLAY}
          </a>
        </p>
      </div>

      <div className="legal-section">
        <h2 className="legal-h2">2. Objet</h2>
        <p>
          Le site 3M Drive permet aux utilisateurs de consulter les services proposés,
          d'effectuer une demande de réservation et, pour les comptes habilités,
          d'accéder à un espace sécurisé de gestion.
        </p>
      </div>

      <div className="legal-section">
        <h2 className="legal-h2">3. Acceptation</h2>
        <p>
          Toute utilisation du site implique l'acceptation pleine et entière des présentes
          conditions générales d'utilisation. L'utilisateur reconnaît également avoir pris
          connaissance des mentions légales et de la politique de confidentialité.
        </p>
      </div>

      <div className="legal-section">
        <h2 className="legal-h2">4. Réservations</h2>
        <p>
          Toute demande de réservation doit être complète, sincère et exacte. L'envoi du
          formulaire ne vaut pas automatiquement acceptation définitive de la course.
          Une confirmation opérationnelle peut être requise selon la disponibilité,
          la faisabilité et les conditions du trajet.
        </p>
      </div>

      <div className="legal-section">
        <h2 className="legal-h2">5. Responsabilités de l'utilisateur</h2>
        <p>L'utilisateur s'engage à :</p>
        <ul className="legal-list">
          <li>ne pas transmettre de fausses informations ;</li>
          <li>ne pas perturber le fonctionnement du site ;</li>
          <li>ne pas tenter d'accéder à des zones non autorisées ;</li>
          <li>utiliser les services dans un cadre licite et conforme au droit français.</li>
        </ul>
      </div>

      <div className="legal-section">
        <h2 className="legal-h2">6. Espace chauffeur / administrateur</h2>
        <p>
          Les accès authentifiés sont strictement personnels. Tout utilisateur disposant
          d'identifiants d'accès doit en assurer la confidentialité. Toute action effectuée
          depuis un compte authentifié est présumée réalisée par son titulaire jusqu'à preuve contraire.
        </p>
      </div>

      <div className="legal-section">
        <h2 className="legal-h2">7. Disponibilité du service</h2>
        <p>
          3M Drive met en œuvre les moyens raisonnables pour assurer la disponibilité du site,
          sans garantir une disponibilité continue ni l'absence totale d'erreurs ou d'interruptions.
        </p>
      </div>

      <div className="legal-section">
        <h2 className="legal-h2">8. Données personnelles</h2>
        <p>
          Le traitement des données personnelles collectées via le site est encadré par la
          politique de confidentialité et protection des données disponible sur la page dédiée.
        </p>
      </div>

      <div className="legal-section">
        <h2 className="legal-h2">9. Propriété intellectuelle</h2>
        <p>
          Les contenus, éléments graphiques, textes, interfaces et composants du site restent
          protégés par le droit de la propriété intellectuelle. Toute reproduction ou réutilisation
          non autorisée est interdite.
        </p>
      </div>

      <div className="legal-section">
        <h2 className="legal-h2">10. Droit applicable</h2>
        <p>
          Les présentes CGU sont soumises au droit français. En cas de litige,
          et à défaut de résolution amiable, les juridictions compétentes sont celles du ressort de Toulouse.
        </p>
      </div>

      <p className="legal-update">
        Dernière mise à jour : avril 2026
      </p>
    </div>
  );
}
