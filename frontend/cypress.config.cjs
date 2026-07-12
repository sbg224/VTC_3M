const fs = require('fs');
const path = require('path');
const { defineConfig } = require('cypress');
const { lighthouse, prepareAudit } = require('cypress-audit');

// Lit backend/.env (non commité) pour récupérer les identifiants admin locaux
// sans les dupliquer en dur dans les specs Cypress.
function readBackendEnv() {
  const envPath = path.resolve(__dirname, '../backend/.env');
  const out = {};
  if (!fs.existsSync(envPath)) return out;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) out[match[1]] = match[2].trim();
  }
  return out;
}

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.cjs',
    specPattern: 'cypress/e2e/**/*.cy.js',
    video: false,
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser = {}, launchOptions) => {
        prepareAudit(launchOptions);
        return launchOptions;
      });
      on('task', {
        lighthouse: lighthouse(),
      });
      const backendEnv = readBackendEnv();
      config.env.ADMIN_EMAIL = backendEnv.ADMIN_LOGIN_EMAIL || 'admin@vtc3m.fr';
      config.env.ADMIN_PASSWORD = backendEnv.ADMIN_PASSWORD || 'Admin2024!';
      return config;
    },
  },
});
