const express      = require('express');
const router       = express.Router();
const { body }     = require('express-validator');
const rateLimit    = require('express-rate-limit');
const reviewCtrl   = require('../controllers/reviewController');
const auth         = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const { handleValidation } = require('../middleware/validate');

// ── Rate limiter spécifique aux routes publiques de review ────────────────────
// Empêche le scan d'UUIDs et le spam d'avis
const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // max 20 tentatives par IP
  message: { error: 'Trop de requêtes. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Routes publiques (token = authentification côté client) ──────────────────

// GET  /api/reviews/:token — infos de la course pour afficher la page de notation
router.get('/:token', reviewLimiter, reviewCtrl.getByToken);

// POST /api/reviews/:token — soumettre un avis
router.post(
  '/:token',
  reviewLimiter,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Note entre 1 et 5 requise.'),
    body('comment').optional().isString().isLength({ max: 1000 }),
  ],
  handleValidation,
  reviewCtrl.submitReview,
);

// ── Routes protégées chauffeur ────────────────────────────────────────────────

// GET /api/reviews/driver/me — liste des avis du chauffeur connecté
router.get('/driver/me', auth, reviewCtrl.getDriverReviews);

// ── Routes admin ──────────────────────────────────────────────────────────────

// GET /api/reviews/admin/all — tous les avis (admin uniquement)
router.get('/admin/all', auth, requireAdmin, reviewCtrl.getAdminReviews);

module.exports = router;
