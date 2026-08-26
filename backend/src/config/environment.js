const path = require('path');

const PLACEHOLDER_PATTERN = /(change[-_ ]?me|changeme|replace[-_ ]?me|your[-_ ]?|votre[-_ ]?|example|exemple|motdepasse|password|secret)/i;
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const SQLITE_MEMORY_URLS = new Set(['sqlite::memory:', 'sqlite://:memory:']);

function requireValue(env, name) {
  const value = env[name]?.trim();
  if (!value) {
    throw new Error(`${name} est obligatoire avec NODE_ENV=${env.NODE_ENV || 'development'}.`);
  }
  return value;
}

function parsePostgresUrl(value, name) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} doit être une URL PostgreSQL valide.`);
  }

  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) {
    throw new Error(`${name} doit utiliser PostgreSQL (postgres:// ou postgresql://).`);
  }
  if (!parsed.hostname || !parsed.pathname || parsed.pathname === '/') {
    throw new Error(`${name} doit préciser un hôte et un nom de base PostgreSQL.`);
  }
  return parsed;
}

function validateSecret(value, name, minimumLength = 16) {
  if (value.length < minimumLength || PLACEHOLDER_PATTERN.test(value)) {
    throw new Error(`${name} doit être un secret non-placeholder d'au moins ${minimumLength} caractères.`);
  }
}

function validateFrontendUrl(value) {
  const values = value.split(',').map((entry) => entry.trim()).filter(Boolean);
  if (!values.length) throw new Error('FRONTEND_URL doit contenir au moins une URL HTTP(S).');
  for (const entry of values) {
    let parsed;
    try {
      parsed = new URL(entry);
    } catch {
      throw new Error('FRONTEND_URL doit contenir uniquement des URL HTTP(S) valides.');
    }
    if (
      !['http:', 'https:'].includes(parsed.protocol)
      || PLACEHOLDER_PATTERN.test(parsed.hostname)
      || LOOPBACK_HOSTS.has(parsed.hostname)
    ) {
      throw new Error('FRONTEND_URL doit contenir uniquement des URL HTTP(S) de production non-placeholder.');
    }
  }
}

function validateProductionEnvironment(env) {
  const databaseUrl = requireValue(env, 'DATABASE_URL');
  parsePostgresUrl(databaseUrl, 'DATABASE_URL');

  const jwtSecret = requireValue(env, 'JWT_SECRET');
  validateSecret(jwtSecret, 'JWT_SECRET', 64);

  validateFrontendUrl(requireValue(env, 'FRONTEND_URL'));

  const adminLogin = requireValue(env, 'ADMIN_LOGIN_EMAIL');
  if (PLACEHOLDER_PATTERN.test(adminLogin)) {
    throw new Error('ADMIN_LOGIN_EMAIL doit être une valeur non-placeholder en production.');
  }
  validateSecret(requireValue(env, 'ADMIN_PASSWORD'), 'ADMIN_PASSWORD', 16);
}

function validateTestDatabaseUrl(env) {
  const testUrl = requireValue(env, 'DATABASE_URL_TEST');
  if (env.DATABASE_URL && testUrl === env.DATABASE_URL.trim()) {
    throw new Error('DATABASE_URL_TEST doit être distincte de DATABASE_URL.');
  }

  if (SQLITE_MEMORY_URLS.has(testUrl)) {
    return { dialect: 'sqlite', storage: ':memory:', logging: false };
  }

  const parsed = parsePostgresUrl(testUrl, 'DATABASE_URL_TEST');
  if (env.DATABASE_URL?.trim()) {
    let productionUrl;
    try {
      productionUrl = parsePostgresUrl(env.DATABASE_URL.trim(), 'DATABASE_URL');
    } catch {
      productionUrl = null;
    }
    const target = (url) => `${url.hostname.toLowerCase()}:${url.port || '5432'}${url.pathname}`;
    if (productionUrl && target(parsed) === target(productionUrl)) {
      throw new Error('DATABASE_URL_TEST doit cibler une base différente de DATABASE_URL.');
    }
  }
  const databaseName = decodeURIComponent(parsed.pathname.slice(1));
  if (!LOOPBACK_HOSTS.has(parsed.hostname) || !/(^|[_-])test([_-]|$)/i.test(databaseName)) {
    throw new Error('DATABASE_URL_TEST doit cibler une base PostgreSQL locale dont le nom contient "test", ou SQLite en mémoire.');
  }

  return buildPostgresConfig(testUrl, env);
}

function buildPostgresConfig(databaseUrl, env) {
  return {
    url: databaseUrl,
    options: {
      dialect: 'postgres',
      protocol: 'postgres',
      dialectOptions: env.DB_SSL === 'true'
        ? { ssl: { require: true, rejectUnauthorized: false } }
        : {},
      logging: false,
    },
  };
}

function resolveDatabaseConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';

  if (nodeEnv === 'production') {
    validateProductionEnvironment(env);
    return buildPostgresConfig(env.DATABASE_URL.trim(), env);
  }

  if (nodeEnv === 'test') {
    return validateTestDatabaseUrl(env);
  }

  if (env.DATABASE_URL?.trim()) {
    parsePostgresUrl(env.DATABASE_URL.trim(), 'DATABASE_URL');
    return buildPostgresConfig(env.DATABASE_URL.trim(), env);
  }

  return {
    dialect: 'sqlite',
    storage: env.DB_PATH || path.join(__dirname, '../../database.sqlite'),
    logging: false,
  };
}

module.exports = {
  resolveDatabaseConfig,
  validateProductionEnvironment,
  validateTestDatabaseUrl,
};
