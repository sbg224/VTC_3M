jest.mock('../src/services/geoService', () => ({
  calculateRoute: jest.fn(),
}));
jest.mock('../src/services/priceService', () => ({
  calculatePrice: jest.fn(),
  getPricingValues: jest.fn(),
}));

const { calculateRoute } = require('../src/services/geoService');
const { calculatePrice, getPricingValues } = require('../src/services/priceService');
const { calculateTrip, getTripCalculationHttpError } = require('../src/services/tripCalculationService');

describe('tripCalculationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    calculateRoute.mockResolvedValue({ distance_km: 18.4, duration_min: 27 });
    calculatePrice.mockReturnValue(42.8);
    getPricingValues.mockReturnValue({ BASE_FEE: 6, PRICE_PER_KM: 2, MINIMUM_PRICE: 12 });
  });

  test('utilise le routage puis calculatePrice comme source tarifaire unique', async () => {
    const result = await calculateTrip('Gare Matabiau', 'Aéroport Toulouse-Blagnac');

    expect(calculateRoute).toHaveBeenCalledWith('Gare Matabiau', 'Aéroport Toulouse-Blagnac');
    expect(calculatePrice).toHaveBeenCalledWith(18.4);
    expect(result).toEqual({
      distance_km: 18.4,
      duration_min: 27,
      estimatedPrice: 42.8,
      breakdown: {
        baseFee: 6,
        pricePerKm: 2,
        minimumPrice: 12,
        distanceCharge: 36.8,
      },
    });
  });

  test('classe une adresse ou route inexploitable en erreur métier 422', () => {
    expect(getTripCalculationHttpError(new Error('Adresse introuvable'))).toMatchObject({ status: 422 });
    expect(getTripCalculationHttpError(new Error('Impossible de calculer l\'itinéraire'))).toMatchObject({ status: 422 });
  });

  test('classe une panne réseau comme indisponibilité 503', () => {
    const error = new Error('getaddrinfo failed');
    error.code = 'ENOTFOUND';
    expect(getTripCalculationHttpError(error)).toMatchObject({ status: 503 });
  });
});
