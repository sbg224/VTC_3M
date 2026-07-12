describe('Réservation publique', () => {
  const uniqueEmail = () => `e2e.${Date.now()}@example.com`;

  // La réservation publique générique (sans slug chauffeur) s'assigne au premier
  // chauffeur actif de la flotte. Sur une base fraîche sans chauffeur, l'API
  // répond 503 par design (voir reservationController.js) — on provisionne donc
  // un chauffeur de test actif avant de valider le parcours de réservation.
  before(() => {
    const driverEmail = `e2e.driver.${Date.now()}@example.com`;
    cy.request('POST', 'http://localhost:5001/api/auth/register', {
      name: 'Chauffeur Test QA',
      email: driverEmail,
      password: 'TestE2E123!',
      phone: '0612345678',
      gdprConsent: true,
      termsAccepted: true,
    }).then(() => {
      cy.request('POST', 'http://localhost:5001/api/auth/login', {
        email: Cypress.env('ADMIN_EMAIL'),
        password: Cypress.env('ADMIN_PASSWORD'),
      }).then(({ body }) => {
        const adminToken = body.token;
        cy.request({
          method: 'GET',
          url: 'http://localhost:5001/api/admin/drivers?status=all&search=' + encodeURIComponent(driverEmail),
          headers: { Authorization: `Bearer ${adminToken}` },
        }).then(({ body: list }) => {
          const created = (list.drivers || list).find((d) => d.email === driverEmail);
          cy.request({
            method: 'PUT',
            url: `http://localhost:5001/api/admin/drivers/${created.id}/status`,
            headers: { Authorization: `Bearer ${adminToken}` },
            body: { status: 'active' },
          });
        });
      });
    });
  });

  it('rejette la soumission sans consentement RGPD/CGU', () => {
    cy.visit('/reservation');
    cy.get('input[name="departureAddress"]').type('Gare Matabiau, Toulouse');
    cy.get('input[name="arrivalAddress"]').type('Aéroport Toulouse-Blagnac');
    cy.get('input[name="date"]').type('2026-12-01');
    cy.get('input[name="time"]').type('14:30');
    cy.get('input[name="firstName"]').type('Jean');
    cy.get('input[name="lastName"]').type('Dupont');
    cy.get('input[name="email"]').type(uniqueEmail());
    cy.get('input[name="phone"]').type('0612345678');
    // Consentements volontairement laissés décochés
    cy.get('form').submit();
    cy.contains('h2', 'Réservation confirmée').should('not.exist');
  });

  it('crée une réservation complète avec consentements cochés', () => {
    cy.visit('/reservation');
    cy.get('input[name="departureAddress"]').type('Gare Matabiau, Toulouse');
    cy.get('input[name="arrivalAddress"]').type('Aéroport Toulouse-Blagnac');
    cy.get('input[name="date"]').type('2026-12-01');
    cy.get('input[name="time"]').type('14:30');
    cy.get('input[name="firstName"]').type('Jean');
    cy.get('input[name="lastName"]').type('Dupont');
    cy.get('input[name="email"]').type(uniqueEmail());
    cy.get('input[name="phone"]').type('0612345678');
    cy.get('input#gdpr').check({ force: true });
    cy.get('input#termsAccepted').check({ force: true });
    cy.contains('button', 'Confirmer ma réservation').click();

    cy.contains('h2', 'Réservation confirmée', { timeout: 10000 }).should('be.visible');
    cy.get('.resv-success-number').invoke('text').should('match', /\S+/);
  });

  it('bloque une adresse email invalide côté client/serveur', () => {
    cy.visit('/reservation');
    cy.get('input[name="departureAddress"]').type('Gare Matabiau, Toulouse');
    cy.get('input[name="arrivalAddress"]').type('Aéroport Toulouse-Blagnac');
    cy.get('input[name="date"]').type('2026-12-01');
    cy.get('input[name="time"]').type('14:30');
    cy.get('input[name="firstName"]').type('Jean');
    cy.get('input[name="lastName"]').type('Dupont');
    cy.get('input[name="email"]').type('email-invalide');
    cy.get('input[name="phone"]').type('0612345678');
    cy.get('input#gdpr').check({ force: true });
    cy.get('input#termsAccepted').check({ force: true });
    cy.contains('button', 'Confirmer ma réservation').click();
    cy.contains('h2', 'Réservation confirmée').should('not.exist');
  });
});
