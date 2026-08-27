/**
 * Tarification « mise à disposition » à l'heure + numérotation légale des
 * factures.
 *
 * Strictement additive : aucune colonne supprimée, aucune donnée réécrite.
 * Idempotente — chaque ajout est précédé d'un contrôle d'existence, de sorte
 * qu'un rejeu partiel (migration interrompue) reprenne sans échouer.
 *
 * Le vérificateur de schéma (runMigrations.verifyExistingSchema) compare les
 * modèles aux colonnes réelles et refuse le démarrage au moindre écart : cette
 * migration et les modèles Reservation / PricingConfig / InvoiceSequence
 * doivent donc rester alignés au type, à la nullabilité et à la valeur par
 * défaut près.
 */
const { DataTypes } = require('sequelize');

// Défauts métier repris de la grille validée : 28,772 €/h TTC, 2 h minimum
// facturables, 25 km inclus par heure réservée. Pilotables ensuite depuis
// l'administration — ces valeurs ne servent qu'à l'amorçage.
const HOURLY_RATE_DEFAULT = 28.772;
const MINIMUM_HOURS_DEFAULT = 2;
const INCLUDED_KM_PER_HOUR_DEFAULT = 25;

const RESERVATION_COLUMNS = {
  // Distingue un transfert d'une mise à disposition. Les réservations déjà en
  // base ont toutes une adresse d'arrivée réelle : les qualifier de transferts
  // est exact, d'où le défaut.
  serviceType: {
    type: DataTypes.ENUM('transfert', 'mise_a_disposition'),
    allowNull: true,
    defaultValue: 'transfert',
  },
  // Durée réservée en heures. Entier : la durée était jusqu'ici transportée
  // sous forme de chaîne (« 3h ») et n'était donc pas calculable.
  serviceDurationHours: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  // Kilométrage réellement parcouru, saisi à la validation de la course.
  // Une mise à disposition n'a pas de destination : la distance n'existe
  // qu'a posteriori, et conditionne le supplément kilométrique.
  actualDistance: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  // Numéro légal de facture (art. 242 nonies A du CGI), distinct du numéro de
  // réservation : une course annulée ne consomme pas de numéro, ce qui garantit
  // une série continue et sans rupture.
  // L'unicité n'est PAS déclarée ici : SQLite refuse « ALTER TABLE ADD COLUMN »
  // porteur d'une contrainte UNIQUE (« Cannot add a UNIQUE column »), ce qui
  // ferait échouer la migration sur toute base de développement neuve. La
  // colonne est ajoutée simple, puis l'index unique est créé séparément
  // ci-dessous — forme acceptée par SQLite comme par PostgreSQL.
  invoiceNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
};

const PRICING_COLUMNS = {
  hourlyRate: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: HOURLY_RATE_DEFAULT,
  },
  minimumHours: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: MINIMUM_HOURS_DEFAULT,
  },
  includedKmPerHour: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: INCLUDED_KM_PER_HOUR_DEFAULT,
  },
};

async function addMissingColumns(qi, table, columns, logger) {
  const existing = await qi.describeTable(table);
  for (const [name, definition] of Object.entries(columns)) {
    if (existing[name]) {
      logger.info(`[MIGRATION] ${table}.${name} déjà présente, ignorée.`);
      continue;
    }
    await qi.addColumn(table, name, definition);
    logger.info(`[MIGRATION] ${table}.${name} ajoutée.`);
  }
}

module.exports = {
  name: '20260826_pricing_and_invoicing',
  up: async (sequelize, logger) => {
    const qi = sequelize.getQueryInterface();

    await addMissingColumns(qi, 'reservations', RESERVATION_COLUMNS, logger);
    await addMissingColumns(qi, 'PricingConfigs', PRICING_COLUMNS, logger);

    // `unique` déclaré sur l'attribut du modèle impose un index unique en base :
    // sans lui, le vérificateur signale « index manquant » et bloque le
    // démarrage. addColumn ne le crée pas de façon fiable selon le dialecte.
    const reservationIndexes = await qi.showIndex('reservations');
    const hasInvoiceIndex = reservationIndexes.some((index) => index.fields
      && index.fields.length === 1
      && (index.fields[0].attribute || index.fields[0].name) === 'invoiceNumber');
    if (!hasInvoiceIndex) {
      await qi.addIndex('reservations', {
        fields: ['invoiceNumber'],
        unique: true,
        name: 'reservations_invoice_number_unique',
      });
      logger.info('[MIGRATION] Index unique reservations.invoiceNumber créé.');
    }

    // Compteur de factures, une ligne par exercice. La table est volontairement
    // minimale et sans horodatage : elle ne porte qu'un état, jamais un
    // historique — la traçabilité est assurée par les factures elles-mêmes.
    const tables = (await qi.showAllTables())
      .map((value) => (typeof value === 'string' ? value : value.tableName || value.name));
    if (!tables.includes('invoice_sequences')) {
      await qi.createTable('invoice_sequences', {
        year: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
        lastNumber: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      });
      logger.info('[MIGRATION] Table invoice_sequences créée.');
    } else {
      logger.info('[MIGRATION] Table invoice_sequences déjà présente, ignorée.');
    }
  },
};
