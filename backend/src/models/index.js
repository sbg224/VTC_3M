const { Sequelize } = require('sequelize');
const path = require('path');

// ── Connexion : PostgreSQL si DATABASE_URL défini, sinon SQLite ──────────────
let sequelize;
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true'
        ? { require: true, rejectUnauthorized: false } // Pour Heroku/Render/Railway
        : false,
    },
    logging: false,
  });
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_PATH || path.join(__dirname, '../../database.sqlite'),
    logging: false,
  });
}

const Driver       = require('./Driver')(sequelize);
const Reservation  = require('./Reservation')(sequelize);
const PricingConfig= require('./PricingConfig')(sequelize);
const Review       = require('./Review')(sequelize);
const RevokedToken = require('./RevokedToken')(sequelize);
const Contact      = require('./Contact')(sequelize);
const ContactEvent = require('./ContactEvent')(sequelize);

// ── Associations ──────────────────────────────────────────────────────────────
// Un chauffeur possède plusieurs réservations
Driver.hasMany(Reservation, {
  foreignKey: 'chauffeurId',
  as: 'reservations',
});
// Une réservation appartient à un chauffeur
Reservation.belongsTo(Driver, {
  foreignKey: 'chauffeurId',
  as: 'chauffeur',
});

// Review ↔ Reservation (1:1)
Review.belongsTo(Reservation, { foreignKey: 'reservationId', as: 'reservation' });
Reservation.hasOne(Review,    { foreignKey: 'reservationId', as: 'review' });

// Review ↔ Driver (N:1)
Review.belongsTo(Driver, { foreignKey: 'chauffeurId', as: 'chauffeur' });
Driver.hasMany(Review,   { foreignKey: 'chauffeurId', as: 'reviews' });

// Contact ↔ Driver (N:1, optionnelle) — seul point de contact entre le
// module carte de visite et le reste de l'app. Driver.js n'est pas modifié.
Contact.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });
Driver.hasMany(Contact,   { foreignKey: 'driverId', as: 'contacts' });

// ContactEvent ↔ Contact (N:1)
ContactEvent.belongsTo(Contact, { foreignKey: 'contactId', as: 'contact' });
Contact.hasMany(ContactEvent,   { foreignKey: 'contactId', as: 'events' });

module.exports = { sequelize, Driver, Reservation, PricingConfig, Review, RevokedToken, Contact, ContactEvent };
