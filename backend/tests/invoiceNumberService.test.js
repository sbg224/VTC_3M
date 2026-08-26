// La base de test est imposée avant tout chargement de src/models, qui lit
// dotenv et retomberait sinon sur la base de développement.
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL_TEST = 'sqlite::memory:';

const { sequelize, Reservation, InvoiceSequence } = require('../src/models');
const { assignInvoiceNumber, formatInvoiceNumber } = require('../src/services/invoiceNumberService');

const YEAR = new Date().getFullYear();

async function createReservation(overrides = {}) {
  return Reservation.create({
    firstName: 'Camille', lastName: 'Durand',
    email: 'camille@example.com', phone: '+33612345678',
    departureAddress: 'Gare Matabiau, Toulouse', arrivalAddress: 'Blagnac',
    date: '2026-08-20', time: '09:30',
    status: 'confirmed',
    ...overrides,
  });
}

beforeAll(async () => {
  // Le dialecte SQLite en mémoire n'a pas de migrations à rejouer : sync()
  // suffit à matérialiser les modèles pour ce test isolé.
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await Reservation.destroy({ where: {}, truncate: true });
  await InvoiceSequence.destroy({ where: {}, truncate: true });
});

describe('invoiceNumberService', () => {
  test('formate le numéro sur six chiffres, préfixé et daté', () => {
    expect(formatInvoiceNumber(2026, 1)).toBe('AH-2026-000001');
    expect(formatInvoiceNumber(2026, 42)).toBe('AH-2026-000042');
    expect(formatInvoiceNumber(2026, 123456)).toBe('AH-2026-123456');
  });

  test('attribue le premier numéro de l\'exercice', async () => {
    const reservation = await createReservation();
    const number = await assignInvoiceNumber(reservation, { status: 'completed', price: 44 });

    expect(number).toBe(formatInvoiceNumber(YEAR, 1));
    await reservation.reload();
    expect(reservation.invoiceNumber).toBe(number);
    expect(reservation.status).toBe('completed');
    expect(Number(reservation.price)).toBe(44);
  });

  test('produit une série continue, sans trou', async () => {
    const numbers = [];
    for (let i = 0; i < 5; i += 1) {
      const reservation = await createReservation();
      numbers.push(await assignInvoiceNumber(reservation, { status: 'completed', price: 30 }));
    }
    expect(numbers).toEqual([1, 2, 3, 4, 5].map((n) => formatInvoiceNumber(YEAR, n)));
  });

  test('une course annulée ne consomme aucun numéro', async () => {
    const first = await createReservation();
    await assignInvoiceNumber(first, { status: 'completed', price: 30 });

    // Course annulée : jamais facturée, donc jamais numérotée.
    await createReservation({ status: 'cancelled' });

    const third = await createReservation();
    const number = await assignInvoiceNumber(third, { status: 'completed', price: 30 });

    // Le numéro suit immédiatement le premier : l'annulation n'a pas créé de
    // rupture dans la série, ce qu'exige l'art. 242 nonies A du CGI.
    expect(number).toBe(formatInvoiceNumber(YEAR, 2));
  });

  test('une réservation déjà facturée conserve son numéro', async () => {
    const reservation = await createReservation();
    const first = await assignInvoiceNumber(reservation, { status: 'completed', price: 44 });
    const second = await assignInvoiceNumber(reservation, { status: 'completed', price: 44 });

    expect(second).toBe(first);
    const sequence = await InvoiceSequence.findByPk(YEAR);
    // Le compteur n'a pas bougé : rejouer la facturation ne brûle pas un numéro.
    expect(sequence.lastNumber).toBe(1);
  });

  test('n\'incrémente pas le compteur si l\'écriture de la réservation échoue', async () => {
    const reservation = await createReservation();
    // L'écriture de la réservation échoue à l'intérieur de la transaction :
    // l'incrément du compteur doit être annulé avec elle. On simule la panne
    // plutôt que de compter sur une donnée invalide — SQLite est permissif là
    // où PostgreSQL rejetterait, et le test doit valoir pour les deux.
    jest.spyOn(reservation, 'update').mockRejectedValueOnce(new Error('écriture impossible'));

    await expect(
      assignInvoiceNumber(reservation, { status: 'completed', price: 44 }),
    ).rejects.toThrow('écriture impossible');

    const sequence = await InvoiceSequence.findByPk(YEAR);
    expect(sequence === null || sequence.lastNumber === 0).toBe(true);
    await reservation.reload();
    expect(reservation.invoiceNumber).toBeNull();
  });

  test('reprend la numérotation au rang suivant d\'un compteur existant', async () => {
    await InvoiceSequence.create({ year: YEAR, lastNumber: 128 });
    const reservation = await createReservation();
    expect(await assignInvoiceNumber(reservation, { status: 'completed', price: 30 }))
      .toBe(formatInvoiceNumber(YEAR, 129));
  });

  test('cloisonne les exercices', async () => {
    // Une série close l'an dernier ne décale pas la numérotation de cette année.
    await InvoiceSequence.create({ year: YEAR - 1, lastNumber: 999 });
    const reservation = await createReservation();
    expect(await assignInvoiceNumber(reservation, { status: 'completed', price: 30 }))
      .toBe(formatInvoiceNumber(YEAR, 1));
  });
});
