/**
 * Middleware de sanitisation des entrées utilisateur
 * Protection contre XSS sur toutes les données reçues
 */
const xss = require('xss');

const xssOptions = {
  whiteList: {},        // Aucune balise HTML autorisée
  stripIgnoreTag: true, // Supprimer les balises non autorisées
  stripIgnoreTagBody: ['script', 'style', 'iframe'],
};

function sanitizeValue(value) {
  if (typeof value === 'string') {
    return xss(value.trim(), xssOptions);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value !== null && typeof value === 'object') {
    const sanitized = {};
    for (const key of Object.keys(value)) {
      sanitized[key] = sanitizeValue(value[key]);
    }
    return sanitized;
  }
  return value;
}

module.exports = (req, res, next) => {
  if (req.body)  req.body  = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
};
