const { Op, fn, col } = require('sequelize');
const { Driver, Review } = require('../models');
const logger = require('../middleware/logger');

/**
 * GET /api/drivers/public
 * Retourne la liste des chauffeurs actifs (nom, entreprise, slug, note moyenne)
 * pour affichage public sur la page d'accueil.
 */
exports.getPublicList = async (req, res) => {
  try {
    const drivers = await Driver.findAll({
      where: {
        role:   'driver',
        status: { [Op.in]: ['trial', 'active'] },
      },
      attributes: ['id', 'name', 'businessName', 'slug'],
      order: [['createdAt', 'ASC']],
    });

    const enriched = await Promise.all(drivers.map(async (driver) => {
      const stats = await Review.findAll({
        where: { chauffeurId: driver.id },
        attributes: [[fn('AVG', col('rating')), 'avg'], [fn('COUNT', col('id')), 'total']],
        raw: true,
      });
      const total = parseInt(stats[0]?.total || 0, 10);
      const avg   = total > 0 ? parseFloat(stats[0].avg) : null;

      return {
        id:           driver.id,
        name:         driver.name,
        businessName: driver.businessName,
        slug:         driver.slug,
        rating:       avg,
        reviewCount:  total,
      };
    }));

    res.json({ drivers: enriched });
  } catch (err) {
    logger.error('Erreur getPublicList', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

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
