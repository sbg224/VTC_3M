const pricing = require('../config/pricing');

/**
 * Calcule le prix d'une course à partir de la distance.
 * @param {number} distance_km - distance en kilomètres
 * @returns {number} prix arrondi à 2 décimales
 */
function calculatePrice(distance_km) {
  if (!distance_km || distance_km <= 0) return pricing.MINIMUM_PRICE;
  const raw = pricing.BASE_FEE + distance_km * pricing.PRICE_PER_KM;
  return Math.round(Math.max(pricing.MINIMUM_PRICE, raw) * 100) / 100;
}

module.exports = { calculatePrice };
