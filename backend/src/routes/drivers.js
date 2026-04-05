const express = require('express');
const router  = express.Router();
const driverController = require('../controllers/driverController');

/**
 * Routes publiques chauffeur
 * Base : /api/drivers
 */

// Profil public d'un chauffeur (par slug) — sans authentification
router.get('/public/:slug', driverController.getPublicProfile);

module.exports = router;
