const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const auth  = require('../middleware/auth');
const checkSubscription = require('../middleware/checkSubscription');

// Public — pas de JWT, appelé depuis la homepage
router.get('/public', statsController.getPublicStats);

// Protégé — tableau de bord chauffeur
router.get('/', auth, checkSubscription, statsController.getStats);

module.exports = router;
