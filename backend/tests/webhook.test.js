const request = require('supertest');
const app = require('../src/index.js');

// Ce test cible spécifiquement le bug corrigé lors de l'audit : le routeur
// billing était monté deux fois, ce qui faisait que le webhook recevait un
// body déjà parsé en JSON au lieu du Buffer brut requis par
// stripe.webhooks.constructEvent() — la vérification de signature échouait
// alors TOUJOURS avec une erreur de type différent ("payload must be a
// Buffer" au lieu de "no signatures found"), symptôme que la route interne
// n'était jamais réellement atteinte avec le bon comportement.
describe('POST /api/billing/webhook', () => {
  test('rejette une requête sans signature Stripe (400, pas une erreur serveur)', async () => {
    const res = await request(app)
      .post('/api/billing/webhook')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ type: 'invoice.payment_succeeded', data: {} }));

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Webhook Error/);
  });

  test('rejette une signature invalide avec le bon message (body reçu en brut, pas en JSON parsé)', async () => {
    const res = await request(app)
      .post('/api/billing/webhook')
      .set('Content-Type', 'application/json')
      .set('Stripe-Signature', 't=1,v1=signature_falsifiee')
      .send(JSON.stringify({ type: 'invoice.payment_succeeded', data: {} }));

    expect(res.status).toBe(400);
    // Si le body était encore parsé en JSON (régression du bug de montage de
    // route), le message contiendrait "must be provided as a string or a
    // Buffer" au lieu de la vérification de signature normale.
    expect(res.body.error).not.toMatch(/must be provided as a string or a Buffer/);
    expect(res.body.error).toMatch(/No signatures found|Webhook Error/);
  });
});
