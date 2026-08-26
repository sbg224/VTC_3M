const {
  resolveDatabaseConfig,
  validateProductionEnvironment,
} = require('../src/config/environment');

const validProduction = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://app:strong-password@db.internal:5432/vtc3m',
  JWT_SECRET: 'a9f0c8e7b6d5f4a3c2b1'.repeat(4),
  FRONTEND_URL: 'https://3mdrive.fr',
  ADMIN_LOGIN_EMAIL: 'admin@3mdrive.fr',
  ADMIN_PASSWORD: 'Admin-Strong-2026-Value',
};

describe('sécurité des environnements', () => {
  test('la production refuse une DATABASE_URL absente', () => {
    const env = { ...validProduction };
    delete env.DATABASE_URL;
    expect(() => resolveDatabaseConfig(env)).toThrow(/DATABASE_URL est obligatoire/);
  });

  test('la production refuse SQLite', () => {
    expect(() => resolveDatabaseConfig({
      ...validProduction,
      DATABASE_URL: 'sqlite:./production.sqlite',
    })).toThrow(/doit utiliser PostgreSQL/);
  });

  test('la production refuse un JWT_SECRET absent ou placeholder', () => {
    const absent = { ...validProduction };
    delete absent.JWT_SECRET;
    expect(() => validateProductionEnvironment(absent)).toThrow(/JWT_SECRET est obligatoire/);
    expect(() => validateProductionEnvironment({
      ...validProduction,
      JWT_SECRET: 'CHANGE_ME_CHANGE_ME_CHANGE_ME_CHANGE_ME_CHANGE_ME_CHANGE_ME_CHANGE_ME_CHANGE_ME',
    })).toThrow(/non-placeholder/);
  });

  test('la production refuse FRONTEND_URL absent', () => {
    const env = { ...validProduction };
    delete env.FRONTEND_URL;
    expect(() => validateProductionEnvironment(env)).toThrow(/FRONTEND_URL est obligatoire/);
  });

  test('une configuration de production complète sélectionne PostgreSQL', () => {
    expect(resolveDatabaseConfig(validProduction)).toMatchObject({
      url: validProduction.DATABASE_URL,
      options: { dialect: 'postgres' },
    });
  });

  test('les tests DB refusent de reprendre DATABASE_URL sans DATABASE_URL_TEST', () => {
    expect(() => resolveDatabaseConfig({
      NODE_ENV: 'test',
      DATABASE_URL: validProduction.DATABASE_URL,
    })).toThrow(/DATABASE_URL_TEST est obligatoire/);
  });

  test('les tests DB refusent une URL de production copiée ou une base distante', () => {
    expect(() => resolveDatabaseConfig({
      NODE_ENV: 'test',
      DATABASE_URL: validProduction.DATABASE_URL,
      DATABASE_URL_TEST: validProduction.DATABASE_URL,
    })).toThrow(/doit être distincte/);
    expect(() => resolveDatabaseConfig({
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://production:secret@127.0.0.1:5432/vtc_test',
      DATABASE_URL_TEST: 'postgresql://test:other-secret@127.0.0.1:5432/vtc_test',
    })).toThrow(/base différente/);
    expect(() => resolveDatabaseConfig({
      NODE_ENV: 'test',
      DATABASE_URL_TEST: 'postgresql://app:secret@db.example.net:5432/vtc_test',
    })).toThrow(/base PostgreSQL locale/);
  });

  test('les tests DB acceptent uniquement SQLite mémoire ou PostgreSQL local nommé test', () => {
    expect(resolveDatabaseConfig({ NODE_ENV: 'test', DATABASE_URL_TEST: 'sqlite::memory:' }))
      .toMatchObject({ dialect: 'sqlite', storage: ':memory:' });
    expect(resolveDatabaseConfig({
      NODE_ENV: 'test',
      DATABASE_URL_TEST: 'postgresql://app:secret@127.0.0.1:5432/vtc_test',
    })).toMatchObject({ options: { dialect: 'postgres' } });
  });
});
