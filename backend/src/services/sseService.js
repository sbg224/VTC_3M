/**
 * sseService.js
 * Gestion des connexions Server-Sent Events (SSE) par chauffeur.
 *
 * Architecture :
 *   clients = Map<driverId: string, Set<Response>>
 *   Un chauffeur peut avoir plusieurs onglets ouverts → plusieurs connexions.
 */

const clients = new Map();

/**
 * Enregistrer une connexion SSE pour un chauffeur.
 * @param {string} driverId
 * @param {import('express').Response} res
 */
function addClient(driverId, res) {
  if (!clients.has(driverId)) {
    clients.set(driverId, new Set());
  }
  clients.get(driverId).add(res);
}

/**
 * Supprimer une connexion SSE (déconnexion client).
 * @param {string} driverId
 * @param {import('express').Response} res
 */
function removeClient(driverId, res) {
  const set = clients.get(driverId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clients.delete(driverId);
}

/**
 * Émettre un événement SSE à tous les onglets ouverts d'un chauffeur.
 * @param {string} driverId
 * @param {string} eventName
 * @param {object} data
 * @returns {number} Nombre de connexions notifiées
 */
function emit(driverId, eventName, data) {
  const set = clients.get(driverId);
  if (!set || set.size === 0) return 0;

  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  let notified = 0;

  set.forEach((res) => {
    try {
      res.write(payload);
      notified++;
    } catch (_) {
      // La connexion est morte — nettoyage passif
      set.delete(res);
    }
  });

  if (set.size === 0) clients.delete(driverId);
  return notified;
}

/**
 * Nombre total de connexions SSE actives (utile pour le debug).
 */
function getStats() {
  let total = 0;
  clients.forEach((set) => { total += set.size; });
  return { drivers: clients.size, connections: total };
}

module.exports = { addClient, removeClient, emit, getStats };
