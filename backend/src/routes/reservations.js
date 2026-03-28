const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/reservationController');
const auth = require('../middleware/auth');
const { validate, reservationRules, completeRules, uuidRule } = require('../middleware/validate');

// Rate limiter uniquement sur la création publique (POST /)
const reservationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite atteinte. Maximum 10 réservations par heure par IP.' },
});

// ── Public ────────────────────────────────────────────────────────────────────
router.post('/', reservationLimiter, reservationRules, validate, ctrl.createReservation);

// ── Protégées (JWT requis) ────────────────────────────────────────────────────
router.get('/',                           auth, ctrl.getAllReservations);
router.get('/:id',        uuidRule, validate, auth, ctrl.getReservation);
router.put('/:id/status', uuidRule, validate, auth, ctrl.updateStatus);
router.put('/:id/complete', [...uuidRule, ...completeRules], validate, auth, ctrl.completeReservation);
router.get('/:id/pdf-reservation', uuidRule, validate, auth, ctrl.downloadReservationPdf);
router.get('/:id/pdf-invoice',     uuidRule, validate, auth, ctrl.downloadInvoicePdf);

module.exports = router;
