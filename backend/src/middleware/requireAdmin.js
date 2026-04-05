/**
 * Middleware requireAdmin
 * À utiliser APRÈS authenticateToken.
 * Vérifie que le driver connecté a le rôle 'admin'.
 */
module.exports = function requireAdmin(req, res, next) {
  if (!req.driver || req.driver.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs.' });
  }
  next();
};
