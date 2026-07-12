describe('Accueil', () => {
  it('affiche la vitrine et les CTA principaux', () => {
    cy.visit('/');
    cy.contains('h1', 'Votre chauffeur').should('be.visible');
    cy.contains('a', 'Réserver maintenant').should('be.visible');
    cy.get('nav').contains('Espace chauffeur').should('be.visible');
  });

  it("n'a pas d'erreur console au chargement", () => {
    const errors = [];
    cy.on('window:before:load', (win) => {
      cy.stub(win.console, 'error').callsFake((msg) => errors.push(msg));
    });
    cy.visit('/');
    cy.contains('h1', 'Votre chauffeur')
      .should('be.visible')
      .then(() => expect(errors, 'console.error appelé').to.have.length(0));
  });

  it('propose la navigation vers réservation et connexion', () => {
    cy.visit('/');
    cy.contains('a', 'Réservation').click();
    cy.location('pathname').should('eq', '/reservation');
    cy.visit('/');
    cy.contains('a', 'Espace chauffeur').click();
    cy.location('pathname').should('eq', '/login');
  });
});
