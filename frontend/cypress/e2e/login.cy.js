describe('Connexion espace chauffeur', () => {
  it('refuse des identifiants invalides avec un message clair', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type('inconnu@example.com');
    cy.get('input[name="password"]').type('MauvaisMotDePasse1!');
    cy.contains('button', 'Se connecter').click();
    cy.location('pathname').should('eq', '/login');
    cy.contains('Email ou mot de passe incorrect').should('be.visible');
  });

  it('connecte le compte admin local et redirige vers son espace', () => {
    cy.visit('/login');
    cy.get('input[name="email"]').type(Cypress.env('ADMIN_EMAIL'));
    cy.get('input[name="password"]').type(Cypress.env('ADMIN_PASSWORD'));
    cy.contains('button', 'Se connecter').click();
    cy.location('pathname', { timeout: 10000 }).should('match', /\/(admin|dashboard)/);
  });

  it('bloque l\'accès direct au dashboard sans authentification', () => {
    cy.clearCookies();
    cy.window().then((win) => win.localStorage.clear());
    cy.visit('/dashboard');
    cy.location('pathname').should('eq', '/login');
  });
});
