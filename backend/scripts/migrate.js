/**
 * Applique les migrations versionnées sans démarrer le serveur Express.
 *
 * Nécessaire parce que `src/index.js` n'exécute `runMigrations()` que dans sa
 * séquence de démarrage complète (connexion, compte admin, tarification, cron,
 * `app.listen`). Ce script isole la seule étape de schéma : il sert aussi bien
 * en local qu'en commande de pré-déploiement Render, avant que l'instance ne
 * commence à servir du trafic.
 *
 * N'utilise jamais `sequelize.sync()` : l'unique autorité de schéma reste le
 * registre ordonné de `src/db/migrations/` (voir MIGRATIONS.md).
 */
require('dotenv').config();

const { sequelize } = require('../src/models');
const { runMigrations } = require('../src/db/runMigrations');
const logger = require('../src/middleware/logger');

async function main() {
  const { host, port, database } = sequelize.config;
  const target = sequelize.getDialect() === 'sqlite'
    ? `sqlite:${sequelize.options.storage}`
    : `${host}:${port}/${database}`;
  logger.info(`[MIGRATION] Cible : ${target}`);

  await sequelize.authenticate();
  await runMigrations(sequelize, logger);
  logger.info('[MIGRATION] Migrations vérifiées/appliquées.');
}

main()
  .then(async () => {
    await sequelize.close();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error(`[MIGRATION] Échec : ${error.message}`);
    try { await sequelize.close(); } catch { /* connexion déjà fermée */ }
    process.exit(1);
  });
