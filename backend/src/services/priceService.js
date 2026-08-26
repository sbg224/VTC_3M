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
  // Mise à disposition : tarif horaire TTC, durée plancher facturable et
  // kilomètres compris dans chaque heure réservée.
  HOURLY_RATE:         parseFloat(process.env.HOURLY_RATE)          || 28.772,
  MINIMUM_HOURS:       parseFloat(process.env.MINIMUM_HOURS)        || 2,
  INCLUDED_KM_PER_HOUR: parseFloat(process.env.INCLUDED_KM_PER_HOUR) || 25,
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
    HOURLY_RATE:   positiveOr(newPricing.hourlyRate,   _pricing.HOURLY_RATE),
    MINIMUM_HOURS: positiveOr(newPricing.minimumHours, _pricing.MINIMUM_HOURS),
    // Un forfait de 0 km inclus est un choix tarifaire légitime (tout le
    // kilométrage devient alors supplément), d'où nonNegativeOr.
    INCLUDED_KM_PER_HOUR: nonNegativeOr(newPricing.includedKmPerHour, _pricing.INCLUDED_KM_PER_HOUR),
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

/**
 * Durée effectivement facturée : la durée réservée, relevée au plancher
 * commercial. Réserver une heure alors que deux sont facturées serait trompeur
 * — l'interface ne propose plus cette durée, mais la règle est appliquée ici,
 * côté serveur, seul endroit qui fasse foi.
 *
 * @param {number} hours - durée réservée en heures
 * @returns {number} durée facturable en heures
 */
function billableHours(hours) {
  const parsed = parseFloat(hours);
  if (!Number.isFinite(parsed) || parsed <= 0) return _pricing.MINIMUM_HOURS;
  return Math.max(_pricing.MINIMUM_HOURS, parsed);
}

/**
 * Prix d'une mise à disposition : part horaire seule.
 *
 * Le supplément kilométrique n'en fait pas partie : à la réservation, aucune
 * destination n'est connue, donc aucune distance. Il est calculé à la
 * validation de la course par calculateExtraKmCharge().
 *
 * @param {number} hours - durée réservée en heures
 * @returns {number} prix TTC arrondi au centime
 */
function calculateHourlyPrice(hours) {
  const price = Math.round(billableHours(hours) * _pricing.HOURLY_RATE * 100) / 100;
  return Number.isFinite(price) ? price : 0;
}

/**
 * Kilomètres compris dans une réservation, proportionnels à la durée facturée.
 *
 * @param {number} hours - durée réservée en heures
 * @returns {number} forfait kilométrique inclus
 */
function includedKm(hours) {
  return billableHours(hours) * _pricing.INCLUDED_KM_PER_HOUR;
}

/**
 * Supplément dû pour les kilomètres dépassant le forfait inclus, facturés au
 * tarif kilométrique du mode transfert.
 *
 * @param {number} hours - durée réservée en heures
 * @param {number} actualDistanceKm - kilométrage réellement parcouru
 * @returns {{ includedKm: number, extraKm: number, charge: number }}
 */
function calculateExtraKmCharge(hours, actualDistanceKm) {
  const included = includedKm(hours);
  const actual = parseFloat(actualDistanceKm);
  if (!Number.isFinite(actual) || actual <= included) {
    return { includedKm: included, extraKm: 0, charge: 0 };
  }
  // Soustraction en centièmes entiers plutôt qu'en flottants : `50.555 - 50`
  // vaut 0.5549999999999997 en binaire et s'arrondirait à 0,55 km au lieu de
  // 0,56. On arrondit chaque opérande avant de soustraire.
  const extraKm = (Math.round(actual * 100) - Math.round(included * 100)) / 100;
  const charge = Math.round(extraKm * _pricing.PRICE_PER_KM * 100) / 100;
  return {
    includedKm: included,
    extraKm,
    charge: Number.isFinite(charge) ? charge : 0,
  };
}

module.exports = {
  calculatePrice,
  calculateHourlyPrice,
  calculateExtraKmCharge,
  billableHours,
  includedKm,
  updatePricingCache,
  getPricingValues,
};
