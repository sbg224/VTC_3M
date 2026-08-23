const { calculateRoute } = require('./geoService');
const { calculatePrice, getPricingValues } = require('./priceService');

const UNAVAILABLE_ERROR_CODES = new Set([
  'ECONNABORTED',
  'ECONNREFUSED',
  'ECONNRESET',
  'ENETUNREACH',
  'ENOTFOUND',
  'ETIMEDOUT',
]);

/**
 * Source tarifaire unique pour la simulation et la création d'un transfert.
 */
async function calculateTrip(departureAddress, arrivalAddress) {
  const { distance_km, duration_min } = await calculateRoute(departureAddress, arrivalAddress);
  const estimatedPrice = calculatePrice(distance_km);
  const pricing = getPricingValues();

  return {
    distance_km,
    duration_min,
    estimatedPrice,
    breakdown: {
      baseFee: pricing.BASE_FEE,
      pricePerKm: pricing.PRICE_PER_KM,
      minimumPrice: pricing.MINIMUM_PRICE,
      distanceCharge: Math.round(distance_km * pricing.PRICE_PER_KM * 100) / 100,
    },
  };
}

/**
 * Traduit les erreurs techniques BAN/OSRM en réponse HTTP sans exposer leurs
 * détails. La cause originale reste disponible pour les journaux serveur.
 */
function getTripCalculationHttpError(error) {
  const message = error?.message || '';

  if (message.includes('Adresse introuvable') || message.includes('Impossible de calculer')) {
    return {
      status: 422,
      message: 'Impossible de localiser les adresses ou de calculer cet itinéraire. Vérifiez les adresses saisies.',
    };
  }

  if (
    message.includes('Délai dépassé')
    || message.includes('indisponible')
    || UNAVAILABLE_ERROR_CODES.has(error?.code)
  ) {
    return {
      status: 503,
      message: 'Service de calcul temporairement indisponible. Veuillez réessayer.',
    };
  }

  return {
    status: 500,
    message: 'Erreur lors du calcul de l\'itinéraire.',
  };
}

module.exports = { calculateTrip, getTripCalculationHttpError };
