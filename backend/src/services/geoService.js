/**
 * Service de géocodage et calcul d'itinéraire
 * Utilise Nominatim (OpenStreetMap) + OSRM (routing open source)
 * Aucune clé API requise
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

/** Convertit une adresse en coordonnées { lat, lon } via Nominatim */
async function geocode(address) {
  const query = encodeURIComponent(address);
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&addressdetails=0`;

  const data = await httpGet(url);

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`Adresse introuvable : "${address}". Vérifiez l'orthographe ou soyez plus précis.`);
  }
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
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
