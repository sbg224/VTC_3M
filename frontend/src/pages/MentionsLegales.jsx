export default function MentionsLegales() {
  return (
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
              <li><strong>Raison sociale :</strong> 3M SERVICES 31</li>
              <li><strong>Nom commercial :</strong> 3M Drive</li>
              <li><strong>Forme juridique :</strong> Entreprise individuelle</li>
              <li><strong>Représentant légal :</strong> Mohamed BAH</li>
              <li><strong>Siège social :</strong> 1 rue Virginia Woolf, 31000 Toulouse, France</li>
              <li><strong>Email :</strong>{' '}
                <a href="mailto:3m.services31@gmail.com" className="legal-link">
                  3m.services31@gmail.com
                </a>
              </li>
              <li><strong>Téléphone :</strong>{' '}
                <a href="tel:+33751044407" className="legal-link">
                  +33 7 51 04 44 07
                </a>
              </li>
              <li><strong>Activité :</strong> Transport de voyageurs — Chauffeur VTC agréé</li>
            </ul>
          </div>

          {/* 2 – Hébergement */}
          <div className="legal-section">
            <h2 className="legal-h2">2. Hébergement</h2>
            <p>
              Ce site est hébergé par un prestataire tiers. Les coordonnées exactes de
              l'hébergeur sont disponibles sur demande à l'adresse{' '}
              <a href="mailto:3m.services31@gmail.com" className="legal-link">
                3m.services31@gmail.com
              </a>.
            </p>
          </div>

          {/* 3 – Propriété intellectuelle */}
          <div className="legal-section">
            <h2 className="legal-h2">3. Propriété intellectuelle</h2>
            <p>
              L'ensemble du contenu de ce site — textes, images, graphismes, logo, icônes,
              sons et logiciels — est la propriété exclusive de 3M SERVICES 31, sauf mention
              contraire. Toute reproduction, distribution, modification, adaptation,
              retransmission ou publication de ces éléments est strictement interdite sans
              l'accord écrit préalable de 3M SERVICES 31.
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
                <span className="legal-contact-icon">✉️</span>
                <a href="mailto:3m.services31@gmail.com" className="legal-link">
                  3m.services31@gmail.com
                </a>
              </div>
              <div className="legal-contact-item">
                <span className="legal-contact-icon">📞</span>
                <a href="tel:+33751044407" className="legal-link">
                  +33 7 51 04 44 07
                </a>
              </div>
              <div className="legal-contact-item">
                <span className="legal-contact-icon">📍</span>
                <span>1 rue Virginia Woolf, 31000 Toulouse</span>
              </div>
            </div>
          </div>

          <p className="legal-update">
            Dernière mise à jour : mars 2026
          </p>

        </div>
      </div>
    </section>
  );
}
