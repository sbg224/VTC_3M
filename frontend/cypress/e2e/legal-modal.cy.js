// Affichage des documents légaux en modale.
//
// Chaque document est vérifié individuellement (un `it` par document) plutôt
// qu'en bouclant sur un cas générique : une régression touchant un seul des
// trois doit nommer lequel.

const DOCS = [
  {
    key: 'mentions-legales',
    path: '/mentions-legales',
    lien: 'Mentions légales',
    titre: 'Mentions légales',
    sections: 8,
  },
  {
    key: 'cgu',
    path: '/cgu',
    lien: 'CGU',
    titre: "Conditions générales d'utilisation",
    sections: 10,
  },
  {
    key: 'politique-rgpd',
    path: '/politique-rgpd',
    lien: 'Politique de confidentialité',
    titre: 'Politique de confidentialité & RGPD',
    sections: 11,
  },
];

const ouvrirDepuisFooter = (doc) => cy.get(`.footer-legal-links a[href="${doc.path}"]`).click();

describe('Documents légaux', () => {
  DOCS.forEach((doc) => {
    describe(doc.titre, () => {
      it('reste accessible comme page complète à son URL', () => {
        cy.visit(doc.path);
        cy.get('.legal-page h1').should('contain', doc.titre.split(' ')[0]);
        cy.get('.legal-body .legal-section').should('have.length', doc.sections);
        cy.get('.legal-modal').should('not.exist');
        cy.get('link[rel="canonical"]').should('have.attr', 'href', `https://3mdrive.fr${doc.path}`);
      });

      it('s’ouvre en modale depuis le footer, sans quitter la page', () => {
        cy.visit('/');
        ouvrirDepuisFooter(doc);
        cy.get('.legal-modal-title').should('have.text', doc.titre);
        cy.get('.legal-modal-body .legal-section').should('have.length', doc.sections);
        cy.location('pathname').should('eq', '/');
        cy.get('body').should('have.css', 'overflow', 'hidden');
        cy.get('.legal-modal-close').click();
        cy.get('.legal-modal').should('not.exist');
        cy.get('body').should('not.have.css', 'overflow', 'hidden');
      });

      // Régression : une garde « déjà sur la page canonique » rendait le lien
      // inerte ici, ce qui donnait l'impression que le document ne s'ouvrait
      // jamais en modale.
      it('s’ouvre aussi en modale depuis sa propre page', () => {
        cy.visit(doc.path);
        ouvrirDepuisFooter(doc);
        cy.get('.legal-modal-title').should('have.text', doc.titre);
      });

      it('garde un lien <a href> réel vers son URL canonique', () => {
        cy.visit('/');
        cy.get('.footer-legal-links a')
          .contains(doc.lien)
          .should('have.attr', 'href', doc.path);
      });
    });
  });

  it('se ferme par Échap et par clic sur l’overlay', () => {
    cy.visit('/');
    ouvrirDepuisFooter(DOCS[1]);
    cy.get('.legal-modal').should('be.visible');
    cy.get('body').type('{esc}');
    cy.get('.legal-modal').should('not.exist');

    ouvrirDepuisFooter(DOCS[1]);
    cy.get('.legal-modal').should('be.visible');
    cy.get('.legal-modal-overlay').trigger('mousedown', 5, 5);
    cy.get('.legal-modal').should('not.exist');
  });

  it('bascule des mentions légales vers la politique de confidentialité', () => {
    cy.visit('/');
    ouvrirDepuisFooter(DOCS[0]);
    cy.get('.legal-modal-body').contains('Politique de confidentialité et RGPD').click();
    cy.get('.legal-modal-title').should('have.text', 'Politique de confidentialité & RGPD');
    cy.location('pathname').should('eq', '/');
  });

  it('permet d’ouvrir la page complète depuis la modale', () => {
    cy.visit('/');
    ouvrirDepuisFooter(DOCS[1]);
    cy.get('.legal-modal-permalink').click();
    cy.location('pathname').should('eq', '/cgu');
    cy.get('.legal-page h1').should('contain', 'Conditions générales');
    cy.get('body').should('not.have.css', 'overflow', 'hidden');
  });

  // L'intérêt principal des modales : le visiteur consulte le document sans
  // perdre ce qu'il a déjà saisi dans le formulaire.
  it('ouvre les deux documents depuis l’inscription sans perdre la saisie', () => {
    cy.visit('/register');
    cy.get('input[name="firstName"], input[name="email"]').first().type('conservation-test');
    cy.contains('label', 'politique de confidentialité').find('a').click();
    cy.get('.legal-modal-title').should('have.text', 'Politique de confidentialité & RGPD');
    cy.get('.legal-modal-close').click();
    cy.contains('label', "conditions générales d'utilisation").find('a').click();
    cy.get('.legal-modal-title').should('have.text', "Conditions générales d'utilisation");
    cy.get('.legal-modal-close').click();
    cy.location('pathname').should('eq', '/register');
    cy.get('input[name="firstName"], input[name="email"]').first()
      .should('have.value', 'conservation-test');
  });

  it('ouvre les deux documents depuis la réservation sans quitter la page', () => {
    cy.visit('/reservation');
    cy.contains('label', 'politique de confidentialité').find('a').click();
    cy.get('.legal-modal-title').should('have.text', 'Politique de confidentialité & RGPD');
    cy.get('.legal-modal-close').click();
    cy.contains('label', "conditions générales d'utilisation").find('a').click();
    cy.get('.legal-modal-title').should('have.text', "Conditions générales d'utilisation");
    cy.get('.legal-modal-close').click();
    cy.location('pathname').should('eq', '/reservation');
  });
});
