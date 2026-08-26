const { calculatePrice, updatePricingCache, getPricingValues } = require('../src/services/priceService');

describe('priceService', () => {
  beforeEach(() => {
    // Revient aux valeurs par défaut avant chaque test — le cache est en
    // mémoire et partagé entre les tests sinon.
    updatePricingCache({ pricePerKm: 2, minimumPrice: 10, baseFee: 0 });
  });

  test('applique le prix minimum en dessous du seuil', () => {
    // 3 km * 2€/km = 6€, sous le minimum de 10€
    expect(calculatePrice(3)).toBe(10);
  });

  test('calcule le prix réel au-dessus du minimum', () => {
    // 10 km * 2€/km = 20€
    expect(calculatePrice(10)).toBe(20);
  });

  test('arrondit à 2 décimales', () => {
    updatePricingCache({ pricePerKm: 1.999, minimumPrice: 5, baseFee: 0 });
    // 3 km * 1.999 = 5.997 → 6.00
    expect(calculatePrice(3)).toBe(6);
  });

  test('inclut les frais de base dans le calcul', () => {
    updatePricingCache({ pricePerKm: 2, minimumPrice: 10, baseFee: 5 });
    // 5€ base + 10 km * 2€/km = 25€
    expect(calculatePrice(10)).toBe(25);
  });

  test('retourne le prix minimum pour une distance nulle, négative ou absente', () => {
    expect(calculatePrice(0)).toBe(10);
    expect(calculatePrice(-5)).toBe(10);
    expect(calculatePrice(null)).toBe(10);
    expect(calculatePrice(undefined)).toBe(10);
  });

  test('updatePricingCache met à jour les valeurs prises en compte par calculatePrice', () => {
    updatePricingCache({ pricePerKm: 5, minimumPrice: 15, baseFee: 2 });
    expect(getPricingValues()).toEqual({ PRICE_PER_KM: 5, MINIMUM_PRICE: 15, BASE_FEE: 2 });
    // 2€ base + 10 km * 5€/km = 52€
    expect(calculatePrice(10)).toBe(52);
  });

  test('conserve les valeurs précédentes si updatePricingCache reçoit des champs invalides', () => {
    updatePricingCache({ pricePerKm: 3, minimumPrice: 12, baseFee: 1 });
    updatePricingCache({ pricePerKm: NaN, minimumPrice: undefined, baseFee: 1 });
    expect(getPricingValues().PRICE_PER_KM).toBe(3);
    expect(getPricingValues().MINIMUM_PRICE).toBe(12);
  });
  test('aucune valeur non finie ne peut entrer dans le cache tarifaire', () => {
    updatePricingCache({ pricePerKm: 3, minimumPrice: 12, baseFee: 4 });
    // baseFee passait auparavant par `??`, qui ne rattrape pas NaN : une seule
    // valeur invalide suffisait à rendre tous les prix NaN.
    for (const invalid of [NaN, Infinity, -Infinity, 'abc', null, undefined, {}]) {
      updatePricingCache({ pricePerKm: invalid, minimumPrice: invalid, baseFee: invalid });
      expect(getPricingValues()).toEqual({ PRICE_PER_KM: 3, MINIMUM_PRICE: 12, BASE_FEE: 4 });
    }
  });

  test('baseFee nul reste accepté, baseFee NaN est rejeté', () => {
    updatePricingCache({ pricePerKm: 2, minimumPrice: 10, baseFee: 5 });
    updatePricingCache({ pricePerKm: 2, minimumPrice: 10, baseFee: 0 });
    expect(getPricingValues().BASE_FEE).toBe(0);
    updatePricingCache({ pricePerKm: 2, minimumPrice: 10, baseFee: NaN });
    expect(getPricingValues().BASE_FEE).toBe(0);
  });

  test('calculatePrice ne retourne jamais NaN ni Infinity', () => {
    for (const distance of [NaN, Infinity, -Infinity, 'abc', null, undefined, {}]) {
      const price = calculatePrice(distance);
      expect(Number.isFinite(price)).toBe(true);
      expect(price).toBe(10);
    }
  });

  test('une distance très grande produit un prix fini', () => {
    const price = calculatePrice(1e6);
    expect(Number.isFinite(price)).toBe(true);
    expect(price).toBe(2000000);
  });
});
