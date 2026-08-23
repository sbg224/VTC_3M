require('dotenv').config();

const confirmation = 'I_HAVE_VERIFIED_THE_TARGET_DATABASE';
if (process.env.CONFIRM_BASELINE_EXISTING !== confirmation) {
  console.error(`Refus: définir CONFIRM_BASELINE_EXISTING=${confirmation} pour autoriser cette opération explicite.`);
  process.exit(1);
}

const { sequelize } = require('../src/models');
const { baselineExistingDatabase } = require('../src/db/runMigrations');
const logger = require('../src/middleware/logger');

async function main() {
  try {
    await sequelize.authenticate();
    await baselineExistingDatabase(sequelize, logger);
  } finally {
    await sequelize.close();
  }
}

main().catch((error) => {
  console.error(`Baseline refusée: ${error.message}`);
  process.exit(1);
});
