// Constantes métier dupliquées à plusieurs endroits (modèle Driver, contrôleurs
// admin/comptabilité) — centralisées pour n'avoir qu'un seul endroit à changer.
// Ne touche pas backend/src/db/runMigrations.js : les migrations sont figées
// dans le temps et ne doivent jamais être modifiées après coup.

// Durée de l'essai gratuit chauffeur, en jours.
const TRIAL_DURATION_DAYS = 14;

// Taux de commission plateforme par défaut (%), appliqué si non défini
// individuellement sur un chauffeur.
const DEFAULT_COMMISSION_RATE = 20.0;

module.exports = { TRIAL_DURATION_DAYS, DEFAULT_COMMISSION_RATE };
