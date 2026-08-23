const { DataTypes } = require('sequelize');
const migrations = require('./migrations');

const BASELINE_NAME = '00000000_initial_schema';
const MIGRATIONS_TABLE = 'schema_migrations';

function tableName(value) {
  if (typeof value === 'string') return value;
  return value.tableName || value.table_name || value.name;
}

function typeMatches(expected, actual) {
  const value = String(actual || '').toUpperCase().replace(/\s+/g, ' ').trim();
  const patterns = {
    UUID: /UUID|CHAR\s*\(36\)|VARCHAR\s*\(36\)/,
    STRING: /VARCHAR|CHARACTER VARYING|NVARCHAR/,
    TEXT: /TEXT/,
    INTEGER: /INT/,
    FLOAT: /FLOAT|REAL|DOUBLE PRECISION|DOUBLE/,
    DECIMAL: /DECIMAL|NUMERIC/,
    BOOLEAN: /BOOL|TINYINT\s*\(1\)/,
    DATE: /TIMESTAMP|DATETIME/,
    DATEONLY: /^DATE$/,
    ENUM: /ENUM|USER-DEFINED|VARCHAR|TEXT/,
  };
  if (!patterns[expected.key]?.test(value)) return false;
  if (expected.key === 'STRING') {
    const expectedLength = expected.options?.length || 255;
    const actualLength = value.match(/(?:VARCHAR|CHARACTER VARYING|NVARCHAR)\s*\((\d+)\)/)?.[1];
    return Number(actualLength) === Number(expectedLength);
  }
  if (expected.key === 'DECIMAL') {
    const precision = expected.options?.precision;
    const scale = expected.options?.scale;
    if (precision === undefined) return true;
    const actualSize = value.match(/(?:DECIMAL|NUMERIC)\s*\((\d+)\s*,\s*(\d+)\)/);
    return Number(actualSize?.[1]) === Number(precision) && Number(actualSize?.[2]) === Number(scale);
  }
  return true;
}

function normalizeDefault(value) {
  if (value === undefined || value === null) return null;
  return String(value)
    .replace(/::[a-z_ ]+(\[\])?/gi, '')
    .replace(/^['"]|['"]$/g, '')
    .replace(/^\((.*)\)$/g, '$1')
    .toLowerCase();
}

function expectedDefault(attribute) {
  const value = attribute.defaultValue;
  if (value === undefined || value === null || typeof value === 'function') return null;
  if (value === DataTypes.UUIDV4 || value?.key === 'UUIDV4') return null;
  return normalizeDefault(value);
}

function actualDefault(value) {
  const normalized = normalizeDefault(value);
  if (normalized === '0') return 'false';
  if (normalized === '1') return 'true';
  return normalized;
}

function indexSignature(unique, fields) {
  return `${unique ? 'unique' : 'plain'}:${fields.join(',')}`;
}

async function verifyExistingSchema(sequelize) {
  const qi = sequelize.getQueryInterface();
  const allTables = (await qi.showAllTables()).map(tableName).filter(Boolean);
  const expectedModels = Object.values(sequelize.models);
  const expectedTables = expectedModels.map((model) => tableName(model.getTableName()));
  const allowedTables = new Set([...expectedTables, MIGRATIONS_TABLE]);
  const errors = [];

  for (const name of expectedTables) {
    if (!allTables.includes(name)) errors.push(`table manquante: ${name}`);
  }
  for (const name of allTables) {
    if (!allowedTables.has(name)) errors.push(`table inattendue: ${name}`);
  }

  if (allTables.includes(MIGRATIONS_TABLE)) {
    const migrationColumns = await qi.describeTable(MIGRATIONS_TABLE);
    const columnNames = Object.keys(migrationColumns);
    if (columnNames.length !== 2 || !migrationColumns.name || !migrationColumns.appliedAt) {
      errors.push(`${MIGRATIONS_TABLE}: colonnes incompatibles`);
    } else {
      if (!typeMatches(DataTypes.STRING, migrationColumns.name.type)
        || !migrationColumns.name.primaryKey || migrationColumns.name.allowNull) {
        errors.push(`${MIGRATIONS_TABLE}.name: définition incompatible`);
      }
      if (!typeMatches(DataTypes.DATE, migrationColumns.appliedAt.type)
        || migrationColumns.appliedAt.allowNull) {
        errors.push(`${MIGRATIONS_TABLE}.appliedAt: définition incompatible`);
      }
    }
    const applied = await getAppliedMigrations(sequelize);
    const knownNames = new Set(migrations.map((migration) => migration.name));
    for (const name of applied) {
      if (!knownNames.has(name)) errors.push(`${MIGRATIONS_TABLE}: migration inconnue (${name})`);
    }
  }

  for (const model of expectedModels) {
    const name = tableName(model.getTableName());
    if (!allTables.includes(name)) continue;
    const actualColumns = await qi.describeTable(name);
    const attributes = model.getAttributes();
    const expectedColumns = new Map(
      Object.entries(attributes).map(([attributeName, attribute]) => [attribute.field || attributeName, attribute]),
    );

    for (const [column, attribute] of expectedColumns) {
      const actual = actualColumns[column];
      if (!actual) {
        errors.push(`${name}.${column}: colonne manquante`);
        continue;
      }
      if (!typeMatches(attribute.type, actual.type)) {
        errors.push(`${name}.${column}: type ${actual.type} incompatible avec ${attribute.type}`);
      }
      if (Boolean(attribute.allowNull) !== Boolean(actual.allowNull)) {
        errors.push(`${name}.${column}: nullabilité incompatible`);
      }
      if (Boolean(attribute.primaryKey) !== Boolean(actual.primaryKey)) {
        errors.push(`${name}.${column}: clé primaire incompatible`);
      }
      const expectedValue = expectedDefault(attribute);
      if (expectedValue !== actualDefault(actual.defaultValue)) {
        errors.push(`${name}.${column}: valeur par défaut incompatible`);
      }
      if (attribute.type.key === 'ENUM') {
        const expectedValues = [...(attribute.values || attribute.type.values || [])].sort();
        const actualValues = [...(actual.special || actual.values || [])].sort();
        if (expectedValues.length !== actualValues.length
          || expectedValues.some((value, index) => value !== actualValues[index])) {
          errors.push(`${name}.${column}: valeurs ENUM incompatibles ou non vérifiables`);
        }
      }
    }
    for (const column of Object.keys(actualColumns)) {
      if (!expectedColumns.has(column)) errors.push(`${name}.${column}: colonne inattendue`);
    }

    const expectedIndexes = new Set();
    for (const index of model.options.indexes || []) {
      expectedIndexes.add(indexSignature(Boolean(index.unique), index.fields.map((field) => field.name || field.attribute || field)));
    }
    for (const [attributeName, attribute] of Object.entries(attributes)) {
      if (attribute.unique) expectedIndexes.add(indexSignature(true, [attribute.field || attributeName]));
    }
    const actualIndexes = await qi.showIndex(name);
    const actualSignatures = new Set(actualIndexes
      .filter((index) => !index.primary)
      .map((index) => indexSignature(Boolean(index.unique), index.fields.map((field) => field.attribute || field.name))));
    for (const signature of expectedIndexes) {
      if (!actualSignatures.has(signature)) errors.push(`${name}: index manquant ou incompatible (${signature})`);
    }
    for (const signature of actualSignatures) {
      if (!expectedIndexes.has(signature)) errors.push(`${name}: index inattendu (${signature})`);
    }
    for (const index of model.options.indexes || []) {
      if (index.name && !actualIndexes.some((actualIndex) => actualIndex.name === index.name)) {
        errors.push(`${name}: nom d'index manquant (${index.name})`);
      }
    }

    const expectedForeignKeys = [...expectedColumns]
      .filter(([, attribute]) => attribute.references)
      .map(([column, attribute]) => `${column}->${tableName(attribute.references.model)}.${attribute.references.key}`);
    const actualForeignKeys = await qi.getForeignKeyReferencesForTable(name);
    const actualForeignKeySignatures = actualForeignKeys.map((reference) =>
      `${reference.columnName}->${reference.referencedTableName}.${reference.referencedColumnName}`,
    );
    for (const signature of expectedForeignKeys) {
      if (!actualForeignKeySignatures.includes(signature)) errors.push(`${name}: clé étrangère manquante (${signature})`);
    }
    for (const signature of actualForeignKeySignatures) {
      if (!expectedForeignKeys.includes(signature)) errors.push(`${name}: clé étrangère inattendue (${signature})`);
    }
  }

  if (errors.length) {
    throw new Error(`Schéma existant incompatible avec la baseline:\n- ${errors.join('\n- ')}`);
  }
  return true;
}

async function ensureMigrationsTable(sequelize) {
  const qi = sequelize.getQueryInterface();
  const tables = (await qi.showAllTables()).map(tableName);
  if (!tables.includes(MIGRATIONS_TABLE)) {
    await qi.createTable(MIGRATIONS_TABLE, {
      name: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
      appliedAt: { type: DataTypes.DATE, allowNull: false },
    });
  }
}

async function getAppliedMigrations(sequelize) {
  const [rows] = await sequelize.query(`SELECT name FROM ${MIGRATIONS_TABLE}`);
  return new Set(rows.map((row) => row.name));
}

async function markApplied(sequelize, name) {
  await sequelize.getQueryInterface().bulkInsert(MIGRATIONS_TABLE, [{ name, appliedAt: new Date() }]);
}

async function inspectDatabase(sequelize) {
  const tables = (await sequelize.getQueryInterface().showAllTables()).map(tableName).filter(Boolean);
  const hasMigrationsTable = tables.includes(MIGRATIONS_TABLE);
  const applied = hasMigrationsTable ? await getAppliedMigrations(sequelize) : new Set();
  return { tables, applied };
}

async function runMigrations(sequelize, logger) {
  const state = await inspectDatabase(sequelize);
  const nonMigrationTables = state.tables.filter((name) => name !== MIGRATIONS_TABLE);

  if (!state.applied.has(BASELINE_NAME) && nonMigrationTables.length > 0) {
    await verifyExistingSchema(sequelize);
    throw new Error(
      'Base existante compatible mais non baselinée. Arrêt sans modification: ' +
      'la baseline requiert une action opérateur explicite après contrôle.',
    );
  }
  if (!state.applied.has(BASELINE_NAME) && state.applied.size > 0) {
    throw new Error('Historique de migrations présent sans baseline et sans schéma applicatif. Arrêt sans modification.');
  }

  await ensureMigrationsTable(sequelize);
  const applied = await getAppliedMigrations(sequelize);
  for (const migration of migrations) {
    if (applied.has(migration.name)) continue;
    await migration.up(sequelize, logger);
    await markApplied(sequelize, migration.name);
  }
}

async function baselineExistingDatabase(sequelize, logger) {
  const state = await inspectDatabase(sequelize);
  if (state.applied.has(BASELINE_NAME)) throw new Error('La baseline est déjà inscrite.');
  if (state.tables.filter((name) => name !== MIGRATIONS_TABLE).length === 0) {
    throw new Error('Base vide: utiliser le runner normal pour créer le schéma.');
  }
  await verifyExistingSchema(sequelize);
  await ensureMigrationsTable(sequelize);
  await markApplied(sequelize, BASELINE_NAME);
  logger.info('[MIGRATION] Baseline explicitement inscrite après vérification stricte du schéma existant.');
}

module.exports = { runMigrations, baselineExistingDatabase, verifyExistingSchema };
