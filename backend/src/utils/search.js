const { literal } = require('sequelize');
const { sequelize } = require('../models');

function escapeLikePattern(value) {
  return String(value || '').replace(/[\\%_]/g, '\\$&');
}

// Les colonnes sont écrites par le code appelant et validées ici ; seule la
// valeur recherchée est dynamique et passe par sequelize.escape(). L'ESCAPE
// explicite conserve une recherche littérale pour %, _ et \\ sur SQLite et
// PostgreSQL, au lieu de les interpréter comme des jokers LIKE.
function likeContains(column, value) {
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(column)) {
    throw new Error('Colonne de recherche invalide.');
  }
  const pattern = `%${escapeLikePattern(value)}%`;
  return literal(`"${column}" LIKE ${sequelize.escape(pattern)} ESCAPE '\\'`);
}

module.exports = { escapeLikePattern, likeContains };
