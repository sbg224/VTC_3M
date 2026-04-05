import { Mail, Phone, MapPin } from 'lucide-react';

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
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: BREADCRUMB_LD }} />
    <section className="section legal-page">
      <div className="container legal-container">

        <div className="legal-header">
          <h1 className="section-title">
            Politique de confidentialité <span className="gold-accent">&amp; RGPD</span>
          </h1>
          <p className="section-subtitle">
            3M Drive s'engage à protéger vos données personnelles conformément au
            Règlement Général sur la Protection des Données (RGPD — UE 2016/679)
            et à la loi Informatique et Libertés.
          </p>
        </div>

        <div className="legal-body">

          {/* 1 – Responsable du traitement */}
          <div className="legal-section">
            <h2 className="legal-h2">1. Responsable du traitement</h2>
            <ul className="legal-list">
              <li><strong>Raison sociale :</strong> 3M SERVICES 31</li>
              <li><strong>Nom commercial :</strong> 3M Drive</li>
              <li><strong>Représentant :</strong> Mohamed BAH</li>
              <li><strong>Adresse :</strong> 1 rue Virginia Woolf, 31000 Toulouse, France</li>
              <li><strong>Email DPO :</strong>{' '}
                <a href="mailto:3m.services31@gmail.com" className="legal-link">
                  3m.services31@gmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* 2 – Données collectées */}
          <div className="legal-section">
            <h2 className="legal-h2">2. Données collectées</h2>
            <p>
              Dans le cadre de la réservation de trajets et de la gestion des courses,
              nous collectons les données suivantes :
            </p>
            <ul className="legal-list">
              <li><strong>Données d'identification :</strong> nom, prénom</li>
              <li><strong>Coordonnées :</strong> adresse email, numéro de téléphone</li>
              <li><strong>Données de trajet :</strong> adresse de départ, adresse d'arrivée, date et heure de la course</li>
              <li><strong>Données de facturation :</strong> montant de la course, référence de réservation</li>
              <li><strong>Données de connexion :</strong> adresse IP, horodatage (à des fins de sécurité)</li>
            </ul>
            <p>
              Aucune donnée bancaire n'est collectée ou stockée directement sur notre plateforme.
            </p>
          </div>

          {/* 3 – Finalités du traitement */}
          <div className="legal-section">
            <h2 className="legal-h2">3. Finalités du traitement</h2>
            <p>Vos données sont utilisées exclusivement pour :</p>
            <ul className="legal-list">
              <li>La prise en charge et l'exécution de votre réservation de trajet</li>
              <li>L'envoi de la confirmation de réservation par email</li>
              <li>La génération et l'envoi de votre facture PDF</li>
              <li>La gestion de la relation client (réponses à vos demandes)</li>
              <li>La sécurisation du service et la prévention des abus</li>
              <li>Le respect de nos obligations légales (comptabilité, fiscalité)</li>
            </ul>
            <p>
              Vos données ne sont jamais utilisées à des fins publicitaires, ni cédées
              ou vendues à des tiers.
            </p>
          </div>

          {/* 4 – Base légale */}
          <div className="legal-section">
            <h2 className="legal-h2">4. Base légale du traitement</h2>
            <p>Le traitement de vos données repose sur les bases légales suivantes :</p>
            <ul className="legal-list">
              <li>
                <strong>Exécution du contrat :</strong> nécessaire à la réalisation de votre
                réservation et à l'émission de la facture.
              </li>
              <li>
                <strong>Obligation légale :</strong> conservation des documents comptables
                et fiscaux conformément à la réglementation française.
              </li>
              <li>
                <strong>Intérêt légitime :</strong> sécurisation de notre plateforme et
                prévention des fraudes.
              </li>
            </ul>
          </div>

          {/* 5 – Durée de conservation */}
          <div className="legal-section">
            <h2 className="legal-h2">5. Durée de conservation</h2>
            <ul className="legal-list">
              <li>
                <strong>Données de réservation :</strong> conservées 3 ans à compter de
                la date de la course, puis supprimées ou anonymisées.
              </li>
              <li>
                <strong>Données de facturation :</strong> conservées 10 ans conformément
                aux obligations comptables légales.
              </li>
              <li>
                <strong>Données de connexion (logs) :</strong> conservées 12 mois maximum.
              </li>
            </ul>
          </div>

          {/* 6 – Destinataires */}
          <div className="legal-section">
            <h2 className="legal-h2">6. Destinataires des données</h2>
            <p>
              Vos données sont traitées uniquement par 3M Drive (Mohamed BAH). Elles peuvent
              être transmises, dans la stricte limite du nécessaire, à des sous-traitants
              techniques (hébergeur, service d'envoi d'emails) qui agissent sous notre
              instruction et sont liés par des engagements de confidentialité conformes au RGPD.
            </p>
            <p>
              Aucun transfert de données hors de l'Union Européenne n'est effectué sans
              garanties appropriées.
            </p>
          </div>

          {/* 7 – Droits des utilisateurs */}
          <div className="legal-section">
            <h2 className="legal-h2">7. Vos droits</h2>
            <p>
              Conformément au RGPD, vous disposez des droits suivants sur vos données
              personnelles :
            </p>
            <ul className="legal-list">
              <li><strong>Droit d'accès :</strong> obtenir une copie des données vous concernant.</li>
              <li><strong>Droit de rectification :</strong> corriger des données inexactes ou incomplètes.</li>
              <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données (« droit à l'oubli »), sous réserve de nos obligations légales.</li>
              <li><strong>Droit à la limitation :</strong> restreindre le traitement de vos données dans certains cas.</li>
              <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré et lisible par machine.</li>
              <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données pour des raisons tenant à votre situation particulière.</li>
            </ul>
            <p>
              Pour exercer ces droits, contactez-nous à :{' '}
              <a href="mailto:3m.services31@gmail.com" className="legal-link">
                3m.services31@gmail.com
              </a>.
              Nous répondrons dans un délai maximum de <strong>30 jours</strong>.
            </p>
            <p>
              En cas de réponse insatisfaisante, vous pouvez déposer une réclamation auprès
              de la <strong>CNIL</strong> (Commission Nationale de l'Informatique et des
              Libertés) — <a href="https://www.cnil.fr" className="legal-link" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>.
            </p>
          </div>

          {/* 8 – Cookies */}
          <div className="legal-section">
            <h2 className="legal-h2">8. Cookies</h2>
            <p>
              Ce site utilise uniquement des cookies techniques strictement nécessaires au
              fonctionnement du service (maintien de session d'authentification). Ces cookies
              ne nécessitent pas votre consentement préalable (article 82 de la loi
              Informatique et Libertés).
            </p>
            <p>
              Aucun cookie de suivi publicitaire, de ciblage ou d'analyse comportementale
              n'est déposé. Vous pouvez à tout moment configurer votre navigateur pour
              refuser ou supprimer les cookies.
            </p>
          </div>

          {/* 9 – Sécurité */}
          <div className="legal-section">
            <h2 className="legal-h2">9. Sécurité des données</h2>
            <p>
              3M Drive met en œuvre des mesures techniques et organisationnelles appropriées
              pour protéger vos données contre tout accès non autorisé, altération, divulgation
              ou destruction : chiffrement des communications (HTTPS), authentification par
              token sécurisé, accès restreint aux données.
            </p>
          </div>

          {/* 10 – Mise à jour */}
          <div className="legal-section">
            <h2 className="legal-h2">10. Mise à jour de cette politique</h2>
            <p>
              Cette politique de confidentialité peut être modifiée à tout moment pour
              refléter les évolutions légales ou de nos pratiques. La date de dernière mise
              à jour est indiquée en bas de cette page. Nous vous invitons à la consulter
              régulièrement.
            </p>
          </div>

          {/* Contact */}
          <div className="legal-section legal-section--contact">
            <h2 className="legal-h2">Contact — Protection des données</h2>
            <div className="legal-contact-block">
              <div className="legal-contact-item">
                <Mail size={16} strokeWidth={1.5} className="legal-contact-icon" />
                <a href="mailto:3m.services31@gmail.com" className="legal-link">
                  3m.services31@gmail.com
                </a>
              </div>
              <div className="legal-contact-item">
                <Phone size={16} strokeWidth={1.5} className="legal-contact-icon" />
                <a href="tel:+33751044407" className="legal-link">
                  +33 7 51 04 44 07
                </a>
              </div>
              <div className="legal-contact-item">
                <MapPin size={16} strokeWidth={1.5} className="legal-contact-icon" />
                <span>1 rue Virginia Woolf, 31000 Toulouse, France</span>
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
