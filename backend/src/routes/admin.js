const express      = require('express');
const router       = express.Router();
const { body }     = require('express-validator');
const adminCtrl    = require('../controllers/adminController');
const auth         = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const { handleValidation } = require('../middleware/validate');

// Toutes les routes admin sont protégées par JWT + rôle admin
router.use(auth, requireAdmin);

// GET  /api/admin/stats                  — statistiques globales plateforme
router.get('/stats', adminCtrl.getGlobalStats);

// GET  /api/admin/drivers                — liste paginée de tous les chauffeurs
router.get('/drivers', adminCtrl.getDrivers);

// GET  /api/admin/drivers/:id            — détail d'un chauffeur
router.get('/drivers/:id', adminCtrl.getDriverDetail);

// PUT  /api/admin/drivers/:id/status     — modifier le statut d'un chauffeur
router.put(
  '/drivers/:id/status',
  [body('status').isIn(['pending', 'trial', 'active', 'suspended', 'expired']).withMessage('Statut invalide.')],
  handleValidation,
  adminCtrl.updateDriverStatus,
);

// POST /api/admin/drivers/:id/notify     — envoyer une notification email à un chauffeur
router.post(
  '/drivers/:id/notify',
  [
    body('subject').optional().trim(),
    body('message').notEmpty().withMessage('Le message est requis.'),
  ],
  handleValidation,
  adminCtrl.notifyDriver,
);

// GET  /api/admin/reservations           — toutes les réservations (tous chauffeurs)
router.get('/reservations', adminCtrl.getAllReservations);

// GET  /api/admin/clients                — CRM clients global
router.get('/clients', adminCtrl.getGlobalClients);

// GET  /api/admin/pricing                — lire la config tarifaire
router.get('/pricing', adminCtrl.getPricing);

// PUT  /api/admin/pricing                — mettre à jour la config tarifaire
router.put(
  '/pricing',
  [
    body('pricePerKm').isFloat({ min: 0 }).withMessage('pricePerKm doit être un nombre >= 0.'),
    body('minimumPrice').isFloat({ min: 0 }).withMessage('minimumPrice doit être un nombre >= 0.'),
    body('baseFee').isFloat({ min: 0 }).withMessage('baseFee doit être un nombre >= 0.'),
  ],
  handleValidation,
  adminCtrl.updatePricing,
);

module.exports = router;
