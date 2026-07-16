const { calculateRoute } = require('../services/geoService');
const { calculatePrice, getPricingValues } = require('../services/priceService');
const logger = require('../middleware/logger');

exports.simulate = async (req, res) => {
  try {
    const { departureAddress, arrivalAddress } = req.body;

    const { distance_km, duration_min } = await calculateRoute(departureAddress, arrivalAddress);
    const estimatedPrice = calculatePrice(distance_km);
    // Toujours lire le cache mémoire à jour (priceService), pas les valeurs
    // figées au démarrage : sinon le détail affiché divergeait du prix réel
    // après une modification tarifaire par l'admin (PUT /api/admin/pricing).
    const pricing = getPricingValues();

    logger.info(`[SIMULATE] ${departureAddress} → ${arrivalAddress} : ${distance_km} km – ${estimatedPrice} €`);

    res.json({
      distance_km,
      duration_min,
      estimatedPrice,
      breakdown: {
        baseFee:       pricing.BASE_FEE,
        pricePerKm:    pricing.PRICE_PER_KM,
        minimumPrice:  pricing.MINIMUM_PRICE,
        distanceCharge: Math.round(distance_km * pricing.PRICE_PER_KM * 100) / 100,
      },
    });
  } catch (err) {
    logger.warn(`[SIMULATE] Erreur : ${err.message}`);

    if (err.message.includes('introuvable') || err.message.includes('Impossible')) {
      return res.status(422).json({ error: err.message });
    }
    if (err.message.includes('Délai') || err.message.includes('indisponible')) {
      return res.status(503).json({ error: 'Service de calcul temporairement indisponible. Veuillez réessayer.' });
    }
    res.status(500).json({ error: 'Erreur lors du calcul de l\'itinéraire.' });
  }
};
