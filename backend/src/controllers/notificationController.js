/**
 * notificationController.js
 * Gestion du flux SSE (Server-Sent Events) pour les notifications en temps réel.
 *
 * ⚠️  L'EventSource du navigateur ne supporte pas les headers personnalisés.
 *     Le JWT est donc passé en query param : /api/notifications/stream?token=xxx
 *     Cette pratique est acceptable pour du SSE (connexion READ-ONLY, token court-vécu).
 */
const jwt    = require('jsonwebtoken');
const sseService = require('../services/sseService');
const logger = require('../middleware/logger');

exports.stream = (req, res) => {
  // ── Authentification via query param ────────────────────────────────────────
  const token = req.query.token;
  if (!token) {
    return res.status(401).end();
  }

  let driver;
  try {
    driver = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    logger.warn(`[SSE] Token invalide : ${err.message}`);
    return res.status(401).end();
  }

  // ── Headers SSE ─────────────────────────────────────────────────────────────
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Désactiver le buffering nginx
  res.flushHeaders();

  // ── Événement de connexion initiale ─────────────────────────────────────────
  res.write(`event: connected\ndata: ${JSON.stringify({ driverId: driver.id, ts: Date.now() })}\n\n`);

  // ── Enregistrer le client ────────────────────────────────────────────────────
  sseService.addClient(driver.id, res);
  logger.info(`[SSE] Chauffeur connecté : ${driver.id} (${sseService.getStats().connections} connexions actives)`);

  // ── Keepalive toutes les 25s (évite les timeouts proxy/load-balancer) ────────
  const keepAlive = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch (_) {
      clearInterval(keepAlive);
    }
  }, 25000);

  // ── Nettoyage à la déconnexion ───────────────────────────────────────────────
  req.on('close', () => {
    clearInterval(keepAlive);
    sseService.removeClient(driver.id, res);
    logger.info(`[SSE] Chauffeur déconnecté : ${driver.id} (${sseService.getStats().connections} connexions restantes)`);
  });
};
