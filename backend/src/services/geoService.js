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

/** Effectue un GET HTTPS et parse le JSON */
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Délai dépassé – service externe indisponible.')),
      TIMEOUT_MS,
    );

    const options = {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    };

    https.get(url, options, (res) => {
      clearTimeout(timeout);
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch { reject(new Error('Réponse API invalide.')); }
      });
    }).on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
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

  // OSRM public demo server (conduite routière)
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`;
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
