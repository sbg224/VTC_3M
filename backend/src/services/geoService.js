/**
 * Service de géocodage et calcul d'itinéraire
 * Géocodage : API Adresse (Base Adresse Nationale, api-adresse.data.gouv.fr)
 *   — service public français, gratuit et sans clé, adapté aux adresses FR.
 * Itinéraire : OSRM (routing open source, serveur de démo public — dette
 *   connue, à auto-héberger avant la mise en production, voir AUDIT_COMPLET).
 */
const https = require('https');
const logger = require('../middleware/logger');

const TIMEOUT_MS = 8000;
const USER_AGENT = `VTC3M/1.0 (${process.env.COMPANY_EMAIL || 'contact@vtc3m.fr'})`;

/**
 * Effectue un GET HTTPS et parse le JSON.
 *
 * Le minuteur couvre l'échange COMPLET, en-têtes ET corps de réponse. Il était
 * auparavant annulé dès la réception des en-têtes : un serveur qui répondait
 * puis cessait d'émettre laissait la promesse pendante indéfiniment, bloquant
 * la création de réservation qui en dépend. À l'expiration, la requête est
 * maintenant réellement avortée (`destroy`), au lieu de laisser la socket
 * ouverte jusqu'à la fin du processus.
 */
function httpGet(url) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let timer = null;

    const settle = (fn, value) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      fn(value);
    };

    const options = {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    };

    const req = https.get(url, options, (res) => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try { settle(resolve, JSON.parse(raw)); }
        catch { settle(reject, new Error('Réponse API invalide.')); }
      });
      res.on('error', (err) => settle(reject, err));
    });

    timer = setTimeout(() => {
      req.destroy();
      settle(reject, new Error('Délai dépassé – service externe indisponible.'));
    }, TIMEOUT_MS);

    req.on('error', (err) => settle(reject, err));
  });
}

/** Convertit une adresse française en coordonnées { lat, lon } via l'API Adresse (BAN) */
async function geocode(address) {
  const query = encodeURIComponent(address);
  const url = `https://api-adresse.data.gouv.fr/search/?q=${query}&limit=1`;

  const data = await httpGet(url);
  const feature = data && Array.isArray(data.features) ? data.features[0] : null;

  if (!feature || !Array.isArray(feature.geometry?.coordinates)) {
    throw new Error(`Adresse introuvable : "${address}". Vérifiez l'orthographe ou soyez plus précis.`);
  }
  const [lon, lat] = feature.geometry.coordinates; // GeoJSON : [longitude, latitude]
  return { lat: parseFloat(lat), lon: parseFloat(lon) };
}

/**
 * Calcule l'itinéraire entre deux adresses.
 * @returns {{ distance_km: number, duration_min: number }}
 */
async function calculateRoute(departureAddress, arrivalAddress) {
  logger.info(`[GEO] Calcul : "${departureAddress}" → "${arrivalAddress}"`);

  const [from, to] = await Promise.all([
    geocode(departureAddress),
    geocode(arrivalAddress),
  ]);

  // OSRM : serveur de démonstration public par défaut — dette technique V2
  // assumée (voir ia/AUDIT.md, AES-A002). OSRM_BASE_URL permet de basculer
  // vers une instance dédiée sans redéployer de code ni toucher au calcul.
  const osrmBaseUrl = (process.env.OSRM_BASE_URL || 'https://router.project-osrm.org').replace(/\/$/, '');
  const url = `${osrmBaseUrl}/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`;
  const routeData = await httpGet(url);

  if (routeData.code !== 'Ok' || !routeData.routes || routeData.routes.length === 0) {
    throw new Error('Impossible de calculer l\'itinéraire entre ces deux adresses.');
  }

  const route = routeData.routes[0];
  const distance_km = Math.round(route.distance / 100) / 10;   // 1 décimale
  const duration_min = Math.round(route.duration / 60);

  logger.info(`[GEO] Résultat : ${distance_km} km – ${duration_min} min`);
  return { distance_km, duration_min };
}

module.exports = { calculateRoute };
