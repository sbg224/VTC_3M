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
 * `parseFloat` rend `NaN` pour toute entrée non numérique, et `??` ne le
 * rattrape pas (`NaN ?? x` vaut `NaN`) : une seule valeur tarifaire invalide
 * empoisonnait le cache et rendait tous les prix `NaN`. `Number.isFinite`
 * ferme aussi la porte à `Infinity` et `-Infinity`.
 */
function positiveOr(value, fallback) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function nonNegativeOr(value, fallback) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

/**
 * Met à jour le cache mémoire avec les nouvelles valeurs tarifaires.
 * Appelé au démarrage (depuis DB) et après chaque modification admin.
 * @param {{ pricePerKm: number, minimumPrice: number, baseFee: number }} newPricing
 */
function updatePricingCache(newPricing) {
  _pricing = {
    PRICE_PER_KM:  positiveOr(newPricing.pricePerKm,   _pricing.PRICE_PER_KM),
    MINIMUM_PRICE: positiveOr(newPricing.minimumPrice, _pricing.MINIMUM_PRICE),
    BASE_FEE:      nonNegativeOr(newPricing.baseFee,   _pricing.BASE_FEE),
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
  // `Number.isFinite` plutôt que `!distance_km` : une distance `Infinity`
  // passait le test et produisait un prix `Infinity`.
  if (!Number.isFinite(distance_km) || distance_km <= 0) return _pricing.MINIMUM_PRICE;
  const raw = _pricing.BASE_FEE + distance_km * _pricing.PRICE_PER_KM;
  const price = Math.round(Math.max(_pricing.MINIMUM_PRICE, raw) * 100) / 100;
  // Dernier filet : aucun prix non fini ne doit sortir de ce service.
  return Number.isFinite(price) ? price : _pricing.MINIMUM_PRICE;
}

module.exports = { calculatePrice, updatePricingCache, getPricingValues };
