// Audits Lighthouse : performance (vitesse), accessibilité, bonnes pratiques
// (fiabilité) et SEO sur les pages publiques les plus visitées.
// Seuils volontairement réalistes pour une SPA Vite non pré-rendue —
// à resserrer une fois le P3 "prerender/SSR" traité.
const thresholds = {
  performance: 55,
  accessibility: 85,
  'best-practices': 85,
  seo: 85,
  pwa: 0,
};

describe('Audits Lighthouse (vitesse, fiabilité, SEO)', () => {
  it('accueil', () => {
    cy.visit('/');
    // hostname forcé en IPv4 : sur certains environnements (dont les runners
    // GitHub Actions), Chrome n'expose son port de debug distant que sur
    // 127.0.0.1, alors que Lighthouse résout "localhost" en ::1 par défaut,
    // ce qui casse la connexion (ECONNREFUSED ::1:<port>).
    cy.lighthouse(thresholds, { hostname: '127.0.0.1' });
  });

  it('réservation', () => {
    cy.visit('/reservation');
    // hostname forcé en IPv4 : sur certains environnements (dont les runners
    // GitHub Actions), Chrome n'expose son port de debug distant que sur
    // 127.0.0.1, alors que Lighthouse résout "localhost" en ::1 par défaut,
    // ce qui casse la connexion (ECONNREFUSED ::1:<port>).
    cy.lighthouse(thresholds, { hostname: '127.0.0.1' });
  });

  it('mentions légales', () => {
    cy.visit('/mentions-legales');
    // hostname forcé en IPv4 : sur certains environnements (dont les runners
    // GitHub Actions), Chrome n'expose son port de debug distant que sur
    // 127.0.0.1, alors que Lighthouse résout "localhost" en ::1 par défaut,
    // ce qui casse la connexion (ECONNREFUSED ::1:<port>).
    cy.lighthouse(thresholds, { hostname: '127.0.0.1' });
  });
});
