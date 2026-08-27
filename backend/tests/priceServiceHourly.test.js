const {
  calculateHourlyPrice, calculateExtraKmCharge, billableHours, includedKm,
  updatePricingCache, getPricingValues,
} = require('../src/services/priceService');

describe('priceService — mise à disposition', () => {
  beforeEach(() => {
    // Grille de référence : 28,772 €/h TTC, 2 h minimum, 25 km inclus par
    // heure, kilomètres supplémentaires au tarif transfert de 2 €/km.
    updatePricingCache({
      pricePerKm: 2, minimumPrice: 10, baseFee: 0,
      hourlyRate: 28.772, minimumHours: 2, includedKmPerHour: 25,
    });
  });

  describe('durée facturable', () => {
    test('relève une durée inférieure au plancher', () => {
      expect(billableHours(1)).toBe(2);
    });

    test('conserve une durée égale au plancher', () => {
      expect(billableHours(2)).toBe(2);
    });

    test('conserve une durée supérieure au plancher', () => {
      expect(billableHours(8)).toBe(8);
    });

    test('retombe sur le plancher pour toute durée absurde', () => {
      for (const invalid of [0, -3, NaN, Infinity, null, undefined, 'abc', {}]) {
        expect(billableHours(invalid)).toBe(2);
      }
    });
  });

  describe('prix de la part horaire', () => {
    test.each([
      [2, 57.54],   // 57,544 arrondi
      [3, 86.32],   // 86,316 arrondi au supérieur
      [4, 115.09],  // 115,088
      [8, 230.18],  // 230,176
      [12, 345.26], // 345,264
    ])('%i h = %f €', (hours, expected) => {
      expect(calculateHourlyPrice(hours)).toBe(expected);
    });

    test('une réservation d\'une heure est facturée deux heures', () => {
      expect(calculateHourlyPrice(1)).toBe(calculateHourlyPrice(2));
    });

    test('ne renvoie jamais de valeur non finie', () => {
      for (const invalid of [NaN, Infinity, -1, 'abc', null]) {
        expect(Number.isFinite(calculateHourlyPrice(invalid))).toBe(true);
      }
    });
  });

  describe('forfait kilométrique inclus', () => {
    test('est proportionnel à la durée facturée', () => {
      expect(includedKm(2)).toBe(50);
      expect(includedKm(4)).toBe(100);
    });

    test('suit le plancher, pas la durée réservée', () => {
      // 1 h réservée mais 2 h facturées : le forfait suit la facturation.
      expect(includedKm(1)).toBe(50);
    });
  });

  describe('supplément kilométrique', () => {
    test('est nul en deçà du forfait', () => {
      expect(calculateExtraKmCharge(2, 30)).toEqual({ includedKm: 50, extraKm: 0, charge: 0 });
    });

    test('est nul exactement au forfait', () => {
      // Borne : 50 km inclus, 50 km parcourus — aucun dépassement.
      expect(calculateExtraKmCharge(2, 50)).toEqual({ includedKm: 50, extraKm: 0, charge: 0 });
    });

    test('facture le dépassement au tarif kilométrique du transfert', () => {
      // 70 km - 50 inclus = 20 km x 2 €/km = 40 €
      expect(calculateExtraKmCharge(2, 70)).toEqual({ includedKm: 50, extraKm: 20, charge: 40 });
    });

    test('facture un dépassement d\'un seul kilomètre', () => {
      expect(calculateExtraKmCharge(2, 51)).toEqual({ includedKm: 50, extraKm: 1, charge: 2 });
    });

    test('arrondit le dépassement au centime', () => {
      // 50,555 - 50 = 0,555 km, arrondi à 0,56 ; 0,56 x 2 €/km = 1,12 €.
      // En flottant brut la soustraction donne 0,5549999... et produirait
      // 0,55 km : ce test verrouille l'arrondi en centièmes entiers.
      const result = calculateExtraKmCharge(2, 50.555);
      expect(result.extraKm).toBe(0.56);
      expect(result.charge).toBe(1.12);
    });

    test('reste neutre pour un kilométrage absent ou absurde', () => {
      for (const invalid of [null, undefined, NaN, 'abc', -10]) {
        expect(calculateExtraKmCharge(2, invalid)).toEqual({ includedKm: 50, extraKm: 0, charge: 0 });
      }
    });

    test('suit le tarif kilométrique courant, modifiable depuis l\'admin', () => {
      updatePricingCache({
        pricePerKm: 3, minimumPrice: 10, baseFee: 0,
        hourlyRate: 28.772, minimumHours: 2, includedKmPerHour: 25,
      });
      // 20 km de dépassement x 3 €/km
      expect(calculateExtraKmCharge(2, 70).charge).toBe(60);
    });

    test('un forfait nul rend tout le kilométrage facturable', () => {
      updatePricingCache({
        pricePerKm: 2, minimumPrice: 10, baseFee: 0,
        hourlyRate: 28.772, minimumHours: 2, includedKmPerHour: 0,
      });
      expect(calculateExtraKmCharge(2, 30)).toEqual({ includedKm: 0, extraKm: 30, charge: 60 });
    });
  });

  describe('cache tarifaire', () => {
    test('conserve les valeurs précédentes si les nouvelles sont invalides', () => {
      updatePricingCache({ hourlyRate: NaN, minimumHours: -1, includedKmPerHour: 'abc' });
      expect(getPricingValues()).toMatchObject({
        HOURLY_RATE: 28.772, MINIMUM_HOURS: 2, INCLUDED_KM_PER_HOUR: 25,
      });
    });
  });
});
