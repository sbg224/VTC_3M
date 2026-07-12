describe('Dashboard admin', () => {
  beforeEach(() => {
    cy.visit('/login');
    cy.get('input[name="email"]').type(Cypress.env('ADMIN_EMAIL'));
    cy.get('input[name="password"]').type(Cypress.env('ADMIN_PASSWORD'));
    cy.contains('button', 'Se connecter').click();
    cy.location('pathname', { timeout: 10000 }).should('match', /\/(admin|dashboard)/);
  });

  it('affiche la vue d\'ensemble avec les compteurs chauffeurs et courses', () => {
    cy.contains("Vue d'ensemble").should('be.visible');
    cy.contains('Total inscrits').should('be.visible');
    cy.contains('Total réservations').should('be.visible');
    cy.contains('Revenus totaux').should('be.visible');
  });

  it('permet de se déconnecter et revient à /login', () => {
    cy.contains(/déconnexion|se déconnecter/i).click({ force: true });
    cy.location('pathname', { timeout: 10000 }).should('eq', '/login');
  });
});
