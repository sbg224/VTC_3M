/**
 * priceService.js
 * Calcul du prix des courses avec cache mémoire dynamique.
 * Les valeurs sont initialisées depuis .env et peuvent être
 * mises à jour en live par l'admin via updatePricingCache().
 */

// ── Cache mémoire ─────────────────────────────────────────────────────────────
// Initialisé depuis les variables d'env (valeurs par défaut si absent)
let _pricing = {
  PRICE_PER_KM:  parseFloat(process.env.PRICE_PER_KM)  || 2.0,
  MINIMUM_PRICE: parseFloat(process.env.MINIMUM_PRICE) || 10.0,
  BASE_FEE:      parseFloat(process.env.BASE_FEE)      || 0.0,
};

/**
 * Met à jour le cache mémoire avec les nouvelles valeurs tarifaires.
 * Appelé au démarrage (depuis DB) et après chaque modification admin.
 * @param {{ pricePerKm: number, minimumPrice: number, baseFee: number }} newPricing
 */
function updatePricingCache(newPricing) {
  _pricing = {
    PRICE_PER_KM:  parseFloat(newPricing.pricePerKm)  || _pricing.PRICE_PER_KM,
    MINIMUM_PRICE: parseFloat(newPricing.minimumPrice) || _pricing.MINIMUM_PRICE,
    BASE_FEE:      parseFloat(newPricing.baseFee)      ?? _pricing.BASE_FEE,
  };
}

/**
 * Retourne une copie des valeurs tarifaires actuelles.
 * @returns {{ PRICE_PER_KM: number, MINIMUM_PRICE: number, BASE_FEE: number }}
 */
function getPricingValues() {
  return { ..._pricing };
}

/**
 * Calcule le prix d'une course à partir de la distance.
 * @param {number} distance_km - distance en kilomètres
 * @returns {number} prix arrondi à 2 décimales
 */
function calculatePrice(distance_km) {
  if (!distance_km || distance_km <= 0) return _pricing.MINIMUM_PRICE;
  const raw = _pricing.BASE_FEE + distance_km * _pricing.PRICE_PER_KM;
  return Math.round(Math.max(_pricing.MINIMUM_PRICE, raw) * 100) / 100;
}

module.exports = { calculatePrice, updatePricingCache, getPricingValues };
