const { DataTypes } = require('sequelize');

module.exports = [
  {
    name: '20260412_add_drivers_commission_rate',
    up: async (sequelize, logger) => {
      const qi = sequelize.getQueryInterface();
      const desc = await qi.describeTable('drivers');
      if (!desc.commissionRate) {
        await qi.addColumn('drivers', 'commissionRate', { type: DataTypes.FLOAT, allowNull: false, defaultValue: 20 });
        logger.info('[MIGRATION] Colonne commissionRate ajoutée à drivers.');
      }
    },
  },
  {
    name: '20260412_add_drivers_gdpr_consent',
    up: async (sequelize, logger) => {
      const qi = sequelize.getQueryInterface();
      const desc = await qi.describeTable('drivers');
      if (!desc.gdprConsent) {
        await qi.addColumn('drivers', 'gdprConsent', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
        logger.info('[MIGRATION] Colonne gdprConsent ajoutée à drivers.');
      }
    },
  },
  {
    name: '20260412_add_drivers_terms_accepted',
    up: async (sequelize, logger) => {
      const qi = sequelize.getQueryInterface();
      const desc = await qi.describeTable('drivers');
      if (!desc.termsAccepted) {
        await qi.addColumn('drivers', 'termsAccepted', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
        logger.info('[MIGRATION] Colonne termsAccepted ajoutée à drivers.');
      }
    },
  },
  {
    name: '20260412_add_reservations_review_token',
    up: async (sequelize, logger) => {
      const qi = sequelize.getQueryInterface();
      const desc = await qi.describeTable('reservations');
      if (!desc.reviewToken) {
        await qi.addColumn('reservations', 'reviewToken', { type: DataTypes.STRING, allowNull: true });
        logger.info('[MIGRATION] Colonne reviewToken ajoutée à reservations.');
      }
    },
  },
  {
    name: '20260412_add_reservations_review_token_unique_index',
    up: async (sequelize, logger) => {
      const qi = sequelize.getQueryInterface();
      const indexes = await qi.showIndex('reservations');
      if (!indexes.some((index) => index.name === 'reservations_review_token_unique')) {
        await qi.addIndex('reservations', ['reviewToken'], { unique: true, name: 'reservations_review_token_unique' });
        logger.info('[MIGRATION] Index unique ajouté sur reservations.reviewToken.');
      }
    },
  },
  {
    name: '20260412_add_reservations_terms_accepted',
    up: async (sequelize, logger) => {
      const qi = sequelize.getQueryInterface();
      const desc = await qi.describeTable('reservations');
      if (!desc.termsAccepted) {
        await qi.addColumn('reservations', 'termsAccepted', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
        logger.info('[MIGRATION] Colonne termsAccepted ajoutée à reservations.');
      }
    },
  },
];
