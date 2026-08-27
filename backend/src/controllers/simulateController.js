const {
  calculateTrip, calculateHourlyService, getTripCalculationHttpError,
} = require('../services/tripCalculationService');
const logger = require('../middleware/logger');

exports.simulate = async (req, res) => {
  try {
    const { departureAddress, arrivalAddress } = req.body;

    const trip = await calculateTrip(departureAddress, arrivalAddress);

    logger.info(`[SIMULATE] ${departureAddress} → ${arrivalAddress} : ${trip.distance_km} km – ${trip.estimatedPrice} €`);

    res.json(trip);
  } catch (err) {
    logger.warn(`[SIMULATE] Erreur : ${err.message}`);
    const httpError = getTripCalculationHttpError(err);
    res.status(httpError.status).json({ error: httpError.message });
  }
};

/**
 * Simulation d'une mise à disposition. Route distincte de `simulate` : sans
 * destination, il n'y a pas d'itinéraire à calculer, donc aucun appel aux
 * services externes BAN/OSRM — la réponse est immédiate et ne peut pas échouer
 * pour indisponibilité d'un tiers.
 */
exports.simulateHourly = async (req, res) => {
  try {
    const result = calculateHourlyService(req.body.hours);
    logger.info(`[SIMULATE] Mise à disposition ${result.hours}h : ${result.estimatedPrice} € – ${result.includedKm} km inclus`);
    res.json(result);
  } catch (err) {
    logger.warn(`[SIMULATE] Erreur mise à disposition : ${err.message}`);
    res.status(500).json({ error: 'Erreur lors du calcul du tarif de mise à disposition.' });
  }
};
