/**
 * RevokedToken.js
 * Blacklist des JWT révoqués (logout, compromission).
 * Chaque entrée = un JTI (JWT ID) révoqué + sa date d'expiration.
 * Un cron nettoie les entrées expirées automatiquement.
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('RevokedToken', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    jti: {
      type: DataTypes.STRING(36), // UUID v4
      allowNull: false,
      unique: true,
      comment: 'JWT ID unique — correspond au champ jti du token signé',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Date d\'expiration du JWT — permet le nettoyage des entrées obsolètes',
    },
  }, {
    tableName: 'revoked_tokens',
    timestamps: true,
    updatedAt: false, // On n'a besoin que de createdAt
    indexes: [
      { fields: ['jti'] },
      { fields: ['expiresAt'] }, // Pour le cleanup
    ],
  });
