const { spawnSync } = require('child_process');
require('dotenv').config();

process.env.NODE_ENV = 'test';

const { validateTestDatabaseUrl } = require('../src/config/environment');
try {
  validateTestDatabaseUrl(process.env);
} catch (error) {
  console.error(`[TEST DB SAFETY] ${error.message}`);
  process.exit(1);
}

const jestBin = require.resolve('jest/bin/jest');
const result = spawnSync(
  process.execPath,
  [jestBin, '--runInBand', '--no-watchman', ...process.argv.slice(2)],
  { stdio: 'inherit', env: process.env },
);

if (result.error) throw result.error;
process.exit(result.status ?? 1);
