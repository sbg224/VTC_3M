const jwt    = require('jsonwebtoken');
const { Driver, RevokedToken } = require('../models');
const logger = require('./logger');

module.exports = async (req, res, next) => {
  try {
    // Cookie httpOnly (frontend web) en priorité, header Bearer en repli
    // (scripts, outils d'admin, tests API — n'affaiblit pas la protection
    // CSRF du cookie : une requête cross-site ne peut pas fixer ce header).
    const authHeader = req.headers.authorization;
    const token = req.cookies?.vtc_session
      || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

    if (!token) {
      return res.status(401).json({ error: 'Accès refusé. Token manquant.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ── Vérifier la blacklist (token révoqué via logout ou compromission) ──────
    if (decoded.jti) {
      const revoked = await RevokedToken.findOne({ where: { jti: decoded.jti } });
      if (revoked) {
        logger.warn(`[AUTH] Token révoqué utilisé – jti: ${decoded.jti} – IP: ${req.ip}`);
        return res.status(401).json({ error: 'Session invalide. Veuillez vous reconnecter.' });
      }
    }

    const driver = await Driver.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
    });

    if (!driver) {
      return res.status(401).json({ error: 'Accès refusé. Compte introuvable.' });
    }

    req.driver       = driver;
    req.tokenPayload = decoded; // Expose jti + exp pour logout et changePassword

    logger.info(`Auth OK – ${driver.email} – ${req.method} ${req.originalUrl}`);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expirée. Veuillez vous reconnecter.' });
    }
    logger.warn(`Auth échouée – ${req.ip} – ${req.originalUrl}`);
    return res.status(401).json({ error: 'Token invalide.' });
  }
};
