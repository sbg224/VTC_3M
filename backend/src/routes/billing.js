const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/billingController');
const auth    = require('../middleware/auth');
const checkSubscription = require('../middleware/checkSubscription');

// ── Webhook Stripe : body RAW obligatoire (avant le parser JSON global) ───────
// Cette route est publique (Stripe signe la requête avec STRIPE_WEBHOOK_SECRET)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  ctrl.handleWebhook
);

// ── Routes protégées (JWT requis) ─────────────────────────────────────────────
// Note : checkSubscription n'est PAS appliqué ici pour permettre l'accès
// aux infos billing même si le compte est expiré (utile pour afficher l'upgrade)
router.get('/info',    auth, ctrl.getBillingInfo);
router.post('/checkout', auth, ctrl.createCheckoutSession);
router.post('/portal',   auth, ctrl.createPortalSession);

module.exports = router;
