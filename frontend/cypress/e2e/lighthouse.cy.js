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
    cy.lighthouse(thresholds);
  });

  it('réservation', () => {
    cy.visit('/reservation');
    cy.lighthouse(thresholds);
  });

  it('mentions légales', () => {
    cy.visit('/mentions-legales');
    cy.lighthouse(thresholds);
  });
});
