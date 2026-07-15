const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/billingController');
const auth    = require('../middleware/auth');
const checkSubscription = require('../middleware/checkSubscription');

// ── Webhook Stripe : monté directement dans index.js (app.post), pas ici ──────
// Voir le commentaire dans backend/src/index.js : un routeur ne peut pas
// exposer '/webhook' à la fois pour le montage brut '/api/billing/webhook'
// (avant express.json()) et pour le montage standard '/api/billing' (après).

// ── Routes protégées (JWT requis) ─────────────────────────────────────────────
// Note : checkSubscription n'est PAS appliqué ici pour permettre l'accès
// aux infos billing même si le compte est expiré (utile pour afficher l'upgrade)
router.get('/info',    auth, ctrl.getBillingInfo);
router.post('/checkout', auth, ctrl.createCheckoutSession);
router.post('/portal',   auth, ctrl.createPortalSession);

module.exports = router;
