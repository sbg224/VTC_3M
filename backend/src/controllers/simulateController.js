const { calculateTrip, getTripCalculationHttpError } = require('../services/tripCalculationService');
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
