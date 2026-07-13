// Audits Lighthouse (vitesse, accessibilité, bonnes pratiques, SEO) exécutés
// en dehors de Cypress : Lighthouse pilote directement sa propre instance
// Chrome via chrome-launcher, sans passer par le relais Cypress <-> Chrome
// (relais qui s'est montré instable en CI — "Chrome tab closed unexpectedly").
//
// Mesuré contre le build de PRODUCTION (`vite preview`), pas le serveur de
// dev : le serveur de dev sert du JS non minifié/non compressé et fausse
// complètement le score performance (47/37 en dev vs 76/84 en prod mesurés
// le 2026-07-12 — voir CHECKLIST_PREPROD.md). Ce script build puis démarre
// son propre `vite preview` le temps de l'audit.
import { spawn } from 'child_process';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';

const PREVIEW_PORT = 4173;
const BASE_URL = process.env.LH_BASE_URL || `http://127.0.0.1:${PREVIEW_PORT}`;

const PAGES = [
  { name: 'accueil', path: '/' },
  { name: 'réservation', path: '/reservation' },
  { name: 'mentions légales', path: '/mentions-legales' },
];

// Seuils calibrés sur la mesure réelle en production du 2026-07-12, après
// correctifs d'accessibilité (contraste, labels de formulaire, hiérarchie
// de titres, cibles tactiles — voir CHECKLIST_PREPROD.md), avec une marge
// de régression.
const THRESHOLDS = {
  performance: 65,
  accessibility: 80,
  'best-practices': 85,
  seo: 85,
};

function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url);
        if (res.ok || res.status < 500) return resolve();
      } catch {
        // pas encore prêt
      }
      if (Date.now() - start > timeoutMs) return reject(new Error(`Timeout en attendant ${url}`));
      setTimeout(tick, 500);
    };
    tick();
  });
}

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
  const preview = spawn('npx', ['vite', 'preview', '--port', String(PREVIEW_PORT), '--strictPort'], {
    stdio: 'inherit',
  });
  const stopPreview = () => preview.kill();
  process.on('exit', stopPreview);

  try {
    await waitForServer(BASE_URL);

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
      process.exitCode = 1;
      return;
    }
    console.log('\n✅ Tous les seuils Lighthouse sont atteints.');
  } finally {
    stopPreview();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
