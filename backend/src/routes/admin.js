const express      = require('express');
const router       = express.Router();
const { body }     = require('express-validator');
const adminCtrl    = require('../controllers/adminController');
const auth         = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const { handleValidation } = require('../middleware/validate');

// Toutes les routes admin sont protégées par JWT + rôle admin
router.use(auth, requireAdmin);

// GET  /api/admin/stats   — statistiques globales plateforme
router.get('/stats', adminCtrl.getGlobalStats);

// GET  /api/admin/drivers — liste paginée de tous les chauffeurs
router.get('/drivers', adminCtrl.getDrivers);

// PUT  /api/admin/drivers/:id/status — modifier le statut d'un chauffeur
router.put(
  '/drivers/:id/status',
  [body('status').isIn(['trial', 'active', 'suspended', 'expired']).withMessage('Statut invalide.')],
  handleValidation,
  adminCtrl.updateDriverStatus,
);

module.exports = router;
