const jwt = require('jsonwebtoken');
const { Driver } = require('../models');
const logger = require('./logger');

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Accès refusé. Token manquant.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const driver = await Driver.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
    });

    if (!driver) {
      return res.status(401).json({ error: 'Accès refusé. Compte introuvable.' });
    }

    req.driver = driver;
    logger.info(`Auth OK - Driver: ${driver.email} - Route: ${req.originalUrl}`);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expirée. Veuillez vous reconnecter.' });
    }
    logger.warn(`Auth échouée - ${req.ip} - ${req.originalUrl}`);
    return res.status(401).json({ error: 'Token invalide.' });
  }
};
