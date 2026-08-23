const express = require('express');
const request = require('supertest');
const { buildReservationRules, validate } = require('../src/middleware/validate');

const FIXED_NOW = new Date('2026-08-17T15:00:00.000Z'); // 17:00 Europe/Paris

function createValidationApp() {
  const app = express();
  app.use(express.json());
  app.post(
    '/reservation',
    buildReservationRules({ nowProvider: () => FIXED_NOW }),
    validate,
    (req, res) => res.status(204).end(),
  );
  return app;
}

const validPayload = {
  firstName: 'Jean',
  lastName: 'Dupont',
  email: 'jean.dupont@example.fr',
  phone: '0612345678',
  departureAddress: 'Gare Matabiau, Toulouse',
  arrivalAddress: 'Aéroport Toulouse-Blagnac',
  date: '2026-08-17',
  time: '17:01',
  passengers: 1,
  luggage: 0,
  comments: '',
  serviceType: 'transfert',
  driverSlug: 'chauffeur-a',
  gdprConsent: true,
  termsAccepted: true,
};

describe('reservationRules date + heure', () => {
  const app = createValidationApp();

  test('refuse une date passée', async () => {
    const response = await request(app).post('/reservation').send({
      ...validPayload,
      date: '2026-08-16',
      time: '18:00',
    });
    expect(response.status).toBe(400);
  });

  test("refuse aujourd'hui avec une heure passée", async () => {
    const response = await request(app).post('/reservation').send({
      ...validPayload,
      time: '16:59',
    });
    expect(response.status).toBe(400);
  });

  test('accepte un créneau futur', async () => {
    const response = await request(app).post('/reservation').send(validPayload);
    expect(response.status).toBe(204);
  });
});
