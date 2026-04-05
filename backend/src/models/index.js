const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_PATH || path.join(__dirname, '../../database.sqlite'),
  logging: false,
});

const Driver = require('./Driver')(sequelize);
const Reservation = require('./Reservation')(sequelize);

// ── Associations ──────────────────────────────────────────────────────────────
// Un chauffeur possède plusieurs réservations
Driver.hasMany(Reservation, {
  foreignKey: 'chauffeur_id',
  as: 'reservations',
});
// Une réservation appartient à un chauffeur
Reservation.belongsTo(Driver, {
  foreignKey: 'chauffeur_id',
  as: 'chauffeur',
});

module.exports = { sequelize, Driver, Reservation };
