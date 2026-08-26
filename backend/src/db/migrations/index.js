const initialSchema = require('./00000000_initial_schema');
const legacyMigrations = require('./legacy');
const businessIndexes = require('./20260823_add_business_indexes');

module.exports = [initialSchema, ...legacyMigrations, businessIndexes];
