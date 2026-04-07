const { Op } = require('sequelize');
const { Driver } = require('../models');
const logger = require('../middleware/logger');

/**
 * GET /api/drivers/public/:slug
 * Retourne les informations publiques d'un chauffeur actif par son slug.
 * Utilisé par la page de réservation dédiée /book/:slug.
 */
exports.getPublicProfile = async (req, res) => {
  try {
    const { slug } = req.params;

    const driver = await Driver.findOne({
      where: {
        slug,
        role:   'driver',                          // jamais l'admin
        status: { [Op.in]: ['trial', 'active'] },
      },
      attributes: ['id', 'name', 'businessName', 'slug'],
    });

    if (!driver) {
      return res.status(404).json({ error: 'Chauffeur introuvable ou inactif.' });
    }

    res.json({ driver });
  } catch (err) {
    logger.error('Erreur getPublicProfile', { error: err.message, slug: req.params.slug });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};
