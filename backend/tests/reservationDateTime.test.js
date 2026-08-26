const {
  BUSINESS_TIME_ZONE,
  getPossibleInstants,
  validateReservationDateTime,
} = require('../src/utils/reservationDateTime');

describe('validation du créneau de réservation', () => {
  const now = new Date('2026-08-17T15:00:00.000Z'); // 17:00 à Paris

  test('utilise explicitement le fuseau Europe/Paris', () => {
    expect(BUSINESS_TIME_ZONE).toBe('Europe/Paris');
  });

  test('refuse une date passée', () => {
    expect(() => validateReservationDateTime('2026-08-16', '18:00', { now }))
      .toThrow('doivent être dans le futur');
  });

  test("refuse aujourd'hui avec une heure passée", () => {
    expect(() => validateReservationDateTime('2026-08-17', '16:59', { now }))
      .toThrow('doivent être dans le futur');
  });

  test('accepte une date et une heure futures', () => {
    expect(validateReservationDateTime('2026-08-17', '17:01', { now })).toBe(true);
  });

  test("refuse une heure inexistante au passage à l'heure d'été", () => {
    expect(() => validateReservationDateTime('2026-03-29', '02:30', {
      now: new Date('2026-03-28T00:00:00.000Z'),
    })).toThrow('invalide dans le fuseau Europe/Paris');
  });

  test("reconnaît les deux occurrences d'une heure ambiguë en hiver", () => {
    const instants = getPossibleInstants('2026-10-25', '02:30');
    expect(instants).toHaveLength(2);
    expect(instants[1] - instants[0]).toBe(60 * 60 * 1000);
  });
});
