// Audits Lighthouse (vitesse, accessibilité, bonnes pratiques, SEO) exécutés
// en dehors de Cypress : Lighthouse pilote directement sa propre instance
// Chrome via chrome-launcher, sans passer par le relais Cypress <-> Chrome
// (relais qui s'est montré instable en CI — "Chrome tab closed unexpectedly").
//
// Seuils volontairement réalistes pour une SPA Vite non pré-rendue —
// à resserrer une fois le P3 "prerender/SSR" traité (voir CHECKLIST_PREPROD.md).
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';

const BASE_URL = process.env.LH_BASE_URL || 'http://127.0.0.1:3000';

const PAGES = [
  { name: 'accueil', path: '/' },
  { name: 'réservation', path: '/reservation' },
  { name: 'mentions légales', path: '/mentions-legales' },
];

// Seuils calibrés sur la mesure réelle du 2026-07-12 (voir CHECKLIST_PREPROD.md
// pour le détail par page), avec une marge de régression. Objectif cible :
// performance 55+, accessibilité 85+ — à resserrer au fil des améliorations
// (P3 : prerender/SSR, code-splitting, correctifs d'accessibilité).
const THRESHOLDS = {
  performance: 45,
  accessibility: 70,
  'best-practices': 85,
  seo: 85,
};

async function auditPage(chrome, page) {
  const result = await lighthouse(`${BASE_URL}${page.path}`, {
    port: chrome.port,
    output: 'json',
    logLevel: 'error',
    onlyCategories: Object.keys(THRESHOLDS),
  });

  const scores = {};
  let ok = true;
  for (const key of Object.keys(THRESHOLDS)) {
    const score = Math.round((result.lhr.categories[key]?.score ?? 0) * 100);
    scores[key] = score;
    if (score < THRESHOLDS[key]) ok = false;
  }
  return { page: page.name, ...scores, ok };
}

async function main() {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  const rows = [];
  let allOk = true;
  try {
    for (const page of PAGES) {
      const row = await auditPage(chrome, page);
      rows.push(row);
      if (!row.ok) allOk = false;
    }
  } finally {
    await chrome.kill();
  }

  console.log(`\nSeuils requis : ${JSON.stringify(THRESHOLDS)}\n`);
  console.table(rows);

  if (!allOk) {
    console.error('\n❌ Un ou plusieurs seuils Lighthouse ne sont pas atteints.');
    process.exit(1);
  }
  console.log('\n✅ Tous les seuils Lighthouse sont atteints.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
