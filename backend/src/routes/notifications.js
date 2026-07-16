const express = require('express');
const router  = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/auth');

/**
 * GET /api/notifications/stream
 * Flux SSE — auth via le cookie httpOnly, envoyé automatiquement par
 * EventSource pour une requête même origine (plus besoin de ?token=<JWT>
 * dans l'URL, visible dans les logs d'un éventuel reverse-proxy).
 * Pas de rate limiting ici car c'est une connexion persistante.
 */
router.get('/stream', authMiddleware, notificationController.stream);

module.exports = router;
