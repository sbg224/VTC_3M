jest.mock('../src/models', () => ({
  Reservation: {
    createUnique: jest.fn(),
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
  },
  Driver: { findOne: jest.fn() },
}));
jest.mock('../src/services/pdfService', () => ({
  generateReservationPdf: jest.fn().mockResolvedValue({ filepath: '/tmp/reservation.pdf' }),
  generateInvoicePdf: jest.fn().mockResolvedValue({ filepath: '/tmp/invoice.pdf' }),
}));
jest.mock('../src/services/emailService', () => ({
  sendAdminNotification: jest.fn().mockResolvedValue({ skipped: true }),
  sendClientConfirmation: jest.fn().mockResolvedValue({ skipped: true }),
  sendInvoiceToClient: jest.fn().mockResolvedValue({ skipped: true }),
  sendInvoiceToDriver: jest.fn().mockResolvedValue({ skipped: true }),
}));
jest.mock('../src/services/smsService', () => ({
  sendAdminSms: jest.fn().mockResolvedValue({ skipped: true }),
}));
jest.mock('../src/services/sseService', () => ({ emit: jest.fn().mockReturnValue(0) }));
jest.mock('../src/middleware/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));
jest.mock('../src/services/tripCalculationService', () => {
  const actual = jest.requireActual('../src/services/tripCalculationService');
  return { ...actual, calculateTrip: jest.fn() };
});

const { Reservation, Driver } = require('../src/models');
const { calculateTrip } = require('../src/services/tripCalculationService');
const controller = require('../src/controllers/reservationController');

const DRIVER_A_ID = '11111111-1111-4111-8111-111111111111';
const DRIVER_B_ID = '22222222-2222-4222-8222-222222222222';
const RESERVATION_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status: jest.fn(function status(code) {
      this.statusCode = code;
      return this;
    }),
    json: jest.fn(function json(body) {
      this.body = body;
      return this;
    }),
    download: jest.fn(),
  };
}

function createPublicRequest(overrides = {}) {
  return {
    ip: '127.0.0.1',
    body: {
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@example.fr',
      phone: '0612345678',
      departureAddress: 'Gare Matabiau, Toulouse',
      arrivalAddress: 'Aéroport Toulouse-Blagnac',
      date: '2026-08-18',
      time: '10:00',
      passengers: 2,
      luggage: 1,
      comments: '',
      gdprConsent: true,
      termsAccepted: true,
      driverSlug: 'chauffeur-a',
      serviceType: 'transfert',
      distance: 1,
      estimatedPrice: 1,
      ...overrides,
    },
  };
}

describe('création sécurisée d’une réservation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Driver.findOne.mockResolvedValue({
      id: DRIVER_A_ID,
      email: 'chauffeur-a@example.fr',
    });
    calculateTrip.mockResolvedValue({
      distance_km: 18.4,
      duration_min: 27,
      estimatedPrice: 42.8,
    });
    Reservation.createUnique.mockImplementation(async (data) => ({
      id: RESERVATION_ID,
      reservationNumber: 'VTC-2026-0001',
      status: 'pending',
      save: jest.fn(),
      ...data,
    }));
  });

  test('ignore distance=1 et estimatedPrice=1 et persiste exclusivement le calcul serveur', async () => {
    const response = createResponse();
    await controller.createReservation(createPublicRequest(), response);

    expect(Driver.findOne).toHaveBeenCalledWith({
      where: expect.objectContaining({ slug: 'chauffeur-a', role: 'driver' }),
    });
    expect(calculateTrip).toHaveBeenCalledWith(
      'Gare Matabiau, Toulouse',
      'Aéroport Toulouse-Blagnac',
    );
    expect(Reservation.createUnique).toHaveBeenCalledWith(expect.objectContaining({
      chauffeurId: DRIVER_A_ID,
      distance: 18.4,
      estimatedPrice: 42.8,
    }));
    expect(response.statusCode).toBe(201);
    expect(response.body.reservation).toMatchObject({ distance: 18.4, estimatedPrice: 42.8 });
  });

  test('une panne du calcul refuse la création sans fallback ni persistance', async () => {
    const error = new Error('getaddrinfo failed');
    error.code = 'ENOTFOUND';
    calculateTrip.mockRejectedValue(error);
    const response = createResponse();

    await controller.createReservation(createPublicRequest(), response);

    expect(response.statusCode).toBe(503);
    expect(Reservation.createUnique).not.toHaveBeenCalled();
    expect(response.body.error).not.toContain('getaddrinfo');
  });

  test('refuse une création sans chauffeur explicite au lieu de choisir le premier actif', async () => {
    const response = createResponse();
    await controller.createReservation(createPublicRequest({ driverSlug: '' }), response);

    expect(response.statusCode).toBe(400);
    expect(Driver.findOne).not.toHaveBeenCalled();
    expect(Reservation.createUnique).not.toHaveBeenCalled();
  });

  test('une mise à disposition est tarifée à l\'heure, sans appel à l\'itinéraire', async () => {
    const response = createResponse();
    await controller.createReservation(createPublicRequest({
      serviceType: 'mise_a_disposition',
      serviceDuration: '2h',
      arrivalAddress: '',
    }), response);

    // Aucune destination : ni géocodage ni itinéraire, donc aucune distance.
    expect(calculateTrip).not.toHaveBeenCalled();
    expect(Reservation.createUnique).toHaveBeenCalledWith(expect.objectContaining({
      serviceType: 'mise_a_disposition',
      serviceDurationHours: 2,
      // Le mode n'est plus encodé dans l'adresse d'arrivée.
      arrivalAddress: '',
      distance: null,
      // 2 h x 28,772 €/h = 57,544 -> 57,54 € (part horaire seule ; le
      // supplément kilométrique est calculé à la validation de la course).
      estimatedPrice: 57.54,
    }));
  });

  test('une mise à disposition sous la durée plancher est facturée au minimum', async () => {
    const response = createResponse();
    await controller.createReservation(createPublicRequest({
      serviceType: 'mise_a_disposition',
      serviceDuration: '1h',
      arrivalAddress: '',
    }), response);

    expect(Reservation.createUnique).toHaveBeenCalledWith(expect.objectContaining({
      // 1 h réservée, 2 h facturées : la règle est appliquée côté serveur,
      // l'interface ne proposant plus cette durée.
      serviceDurationHours: 2,
      estimatedPrice: 57.54,
    }));
  });

  test('une durée de mise à disposition invalide est refusée', async () => {
    const response = createResponse();
    await controller.createReservation(createPublicRequest({
      serviceType: 'mise_a_disposition',
      serviceDuration: 'abc',
      arrivalAddress: '',
    }), response);

    expect(response.statusCode).toBe(400);
    expect(Reservation.createUnique).not.toHaveBeenCalled();
  });
});

describe('isolation multi-tenant chauffeur A → chauffeur B', () => {
  const reservationA = {
    id: RESERVATION_ID,
    chauffeurId: DRIVER_A_ID,
    status: 'pending',
    save: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Reservation.findOne.mockImplementation(async ({ where }) => (
      where.id === RESERVATION_ID && where.chauffeurId === DRIVER_A_ID ? reservationA : null
    ));
  });

  test.each([
    ['lecture', controller.getReservation, {}],
    ['annulation / changement de statut', controller.updateStatus, { status: 'cancelled' }],
    ['complétion', controller.completeReservation, { price: 50 }],
    ['PDF réservation', controller.downloadReservationPdf, {}],
    ['PDF facture', controller.downloadInvoicePdf, {}],
  ])('B reçoit 404 pour %s de R1 appartenant à A', async (label, handler, body) => {
    const request = {
      params: { id: RESERVATION_ID },
      body,
      driver: { id: DRIVER_B_ID, email: 'chauffeur-b@example.fr' },
    };
    const response = createResponse();

    await handler(request, response);

    expect(Reservation.findOne).toHaveBeenCalledWith({
      where: { id: RESERVATION_ID, chauffeurId: DRIVER_B_ID },
    });
    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({ error: 'Réservation introuvable.' });
  });

  test('la liste chauffeur est également limitée au chauffeur authentifié', async () => {
    Reservation.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });
    const response = createResponse();
    await controller.getAllReservations({
      query: {},
      driver: { id: DRIVER_B_ID },
    }, response);

    expect(Reservation.findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { chauffeurId: DRIVER_B_ID },
    }));
  });
});
