const { DataTypes } = require('sequelize');

const MIGRATIONS = [
  {
    name: '20260412_add_drivers_commission_rate',
    up: async (sequelize, logger) => {
      const qi = sequelize.getQueryInterface();
      const desc = await qi.describeTable('drivers');
      if (!desc.commissionRate) {
        await qi.addColumn('drivers', 'commissionRate', {
          type: DataTypes.FLOAT,
          allowNull: false,
          defaultValue: 20.0,
        });
        logger.info('[MIGRATION] Colonne commissionRate ajoutée à drivers (défaut : 20%).');
      }
    },
  },
  {
    name: '20260412_add_drivers_gdpr_consent',
    up: async (sequelize, logger) => {
      const qi = sequelize.getQueryInterface();
      const desc = await qi.describeTable('drivers');
      if (!desc.gdprConsent) {
        await qi.addColumn('drivers', 'gdprConsent', {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        });
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
        await qi.addColumn('drivers', 'termsAccepted', {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        });
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
        await qi.addColumn('reservations', 'reviewToken', {
          type: DataTypes.STRING,
          allowNull: true,
          unique: true,
        });
        logger.info('[MIGRATION] Colonne reviewToken ajoutée à reservations.');
      }
    },
  },
  {
    name: '20260412_add_reservations_terms_accepted',
    up: async (sequelize, logger) => {
      const qi = sequelize.getQueryInterface();
      const desc = await qi.describeTable('reservations');
      if (!desc.termsAccepted) {
        await qi.addColumn('reservations', 'termsAccepted', {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        });
        logger.info('[MIGRATION] Colonne termsAccepted ajoutée à reservations.');
      }
    },
  },
];

async function ensureMigrationsTable(sequelize) {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) PRIMARY KEY,
      appliedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedMigrations(sequelize) {
  const [rows] = await sequelize.query('SELECT name FROM schema_migrations');
  return new Set(rows.map((row) => row.name));
}

async function markApplied(sequelize, name) {
  await sequelize.query(
    'INSERT INTO schema_migrations (name, appliedAt) VALUES (:name, :appliedAt)',
    { replacements: { name, appliedAt: new Date() } }
  );
}

async function runMigrations(sequelize, logger) {
  await ensureMigrationsTable(sequelize);
  const applied = await getAppliedMigrations(sequelize);

  for (const migration of MIGRATIONS) {
    if (applied.has(migration.name)) continue;
    await migration.up(sequelize, logger);
    await markApplied(sequelize, migration.name);
  }
}

module.exports = { runMigrations };
