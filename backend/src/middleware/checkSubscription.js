/**
 * Middleware checkSubscription
 * Vérifie que le chauffeur connecté a le droit d'accéder aux routes protégées.
 * Doit être placé APRÈS le middleware auth.js.
 *
 * Règles d'accès :
 *   - status 'trial'  + trialEndDate dans le futur → OK
 *   - status 'active' (abonnement Stripe actif)    → OK
 *   - status 'trial'  + trialEndDate expiré        → 402 (essai terminé)
 *   - status 'expired'                             → 402
 *   - status 'suspended'                           → 403
 */
const { Driver } = require('../models');
const logger = require('./logger');

module.exports = async (req, res, next) => {
  try {
    // Recharger le driver depuis la DB pour avoir les données à jour
    const driver = await Driver.findByPk(req.driver.id);

    // ── L'admin plateforme bypass totalement la vérification d'abonnement ────
    if (driver && driver.role === 'admin') {
      req.driver = driver;
      return next();
    }
    if (!driver) {
      return res.status(401).json({ error: 'Compte introuvable.' });
    }

    // ── Compte en attente de validation admin ────────────────────────────────
    if (driver.status === 'pending') {
      logger.warn(`[SUBSCRIPTION] Accès refusé – compte en attente de validation : ${driver.email}`);
      return res.status(403).json({
        error: 'Votre compte est en attente de validation par l\'administrateur. Vous recevrez un email dès que votre accès sera activé.',
        code: 'ACCOUNT_PENDING',
      });
    }

    // ── Compte suspendu par l'admin plateforme ───────────────────────────────
    if (driver.status === 'suspended') {
      logger.warn(`[SUBSCRIPTION] Accès refusé – compte suspendu : ${driver.email}`);
      return res.status(403).json({
        error: 'Votre compte a été suspendu. Contactez le support.',
        code: 'ACCOUNT_SUSPENDED',
      });
    }

    // ── Abonnement actif ─────────────────────────────────────────────────────
    if (driver.status === 'active') {
      req.driver = driver; // rafraîchir req.driver
      return next();
    }

    // ── Essai gratuit ────────────────────────────────────────────────────────
    if (driver.status === 'trial') {
      const now = new Date();
      const trialEnd = driver.trialEndDate ? new Date(driver.trialEndDate) : null;

      if (trialEnd && now <= trialEnd) {
        // Essai en cours — calcul du nombre de jours restants
        const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
        req.driver = driver;
        res.setHeader('X-Trial-Days-Left', String(daysLeft));
        return next();
      }

      // Essai expiré → mettre à jour le statut automatiquement
      await driver.update({ status: 'expired' });
      logger.info(`[SUBSCRIPTION] Essai expiré automatiquement : ${driver.email}`);
    }

    // ── Essai expiré ou statut expired ──────────────────────────────────────
    const trialEnd = driver.trialEndDate;
    logger.warn(`[SUBSCRIPTION] Accès refusé – essai/abonnement expiré : ${driver.email}`);
    return res.status(402).json({
      error: 'Votre essai gratuit est terminé. Abonnez-vous pour continuer.',
      code: 'SUBSCRIPTION_REQUIRED',
      trialEndDate: trialEnd,
    });

  } catch (err) {
    logger.error(`[SUBSCRIPTION] Erreur middleware : ${err.message}`);
    return res.status(500).json({ error: 'Erreur serveur lors de la vérification de l\'abonnement.' });
  }
};
