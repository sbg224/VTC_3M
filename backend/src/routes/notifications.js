const express = require('express');
const router  = express.Router();
const notificationController = require('../controllers/notificationController');

/**
 * GET /api/notifications/stream
 * Flux SSE — auth via ?token=<JWT> (EventSource ne supporte pas les headers)
 * Pas de rate limiting ici car c'est une connexion persistante.
 */
router.get('/stream', notificationController.stream);

module.exports = router;
