/**
 * reviewController.js
 * Module avis clients post-course.
 * Routes publiques (pas de JWT) — le token UUID remplace l'auth.
 */

const { Review, Reservation, Driver } = require('../models');
const { Op, fn, col } = require('sequelize');
const logger = require('../middleware/logger');

// ── Récupère les infos de la course via le token (pour afficher la page d'avis) ──
exports.getByToken = async (req, res) => {
  try {
    const { token } = req.params;

    const reservation = await Reservation.findOne({
      where: { reviewToken: token },
      attributes: ['id', 'reservationNumber', 'firstName', 'lastName', 'date', 'time',
                   'departureAddress', 'arrivalAddress', 'chauffeurId'],
      include: [{
        model: Driver,
        as: 'chauffeur',
        attributes: ['name', 'businessName'],
      }],
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Lien invalide ou expiré.' });
    }

    // Vérifier si un avis existe déjà pour cette réservation
    const existing = await Review.findOne({ where: { reservationId: reservation.id } });
    if (existing) {
      return res.status(409).json({
        error: 'Vous avez déjà soumis un avis pour cette course.',
        alreadySubmitted: true,
        rating: existing.rating,
      });
    }

    res.json({
      reservationNumber: reservation.reservationNumber,
      date:              reservation.date,
      time:              reservation.time,
      departure:         reservation.departureAddress,
      arrival:           reservation.arrivalAddress,
      clientName:        `${reservation.firstName} ${reservation.lastName}`,
      driverName:        reservation.chauffeur?.name || 'Votre chauffeur',
      companyName:       reservation.chauffeur?.businessName || null,
    });
  } catch (err) {
    logger.error('[REVIEW] getByToken :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// ── Soumettre un avis ─────────────────────────────────────────────────────────
exports.submitReview = async (req, res) => {
  try {
    const { token } = req.params;
    const { rating, comment } = req.body;

    // Validation
    const ratingInt = parseInt(rating, 10);
    if (!ratingInt || ratingInt < 1 || ratingInt > 5) {
      return res.status(400).json({ error: 'Note invalide (1 à 5 requis).' });
    }

    const reservation = await Reservation.findOne({
      where: { reviewToken: token },
      attributes: ['id', 'reservationNumber', 'firstName', 'lastName',
                   'email', 'chauffeurId', 'status'],
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Lien invalide ou expiré.' });
    }

    if (reservation.status !== 'completed') {
      return res.status(400).json({ error: 'Impossible de noter une course non terminée.' });
    }

    // Un seul avis par réservation
    const existing = await Review.findOne({ where: { reservationId: reservation.id } });
    if (existing) {
      return res.status(409).json({
        error: 'Un avis a déjà été soumis pour cette course.',
        alreadySubmitted: true,
      });
    }

    await Review.create({
      reservationId: reservation.id,
      chauffeurId:   reservation.chauffeurId,
      rating:        ratingInt,
      comment:       comment?.trim()?.substring(0, 1000) || null,
      clientName:    `${reservation.firstName} ${reservation.lastName}`,
      clientEmail:   reservation.email,
    });

    logger.info(`[REVIEW] Avis ${ratingInt}/5 reçu pour ${reservation.reservationNumber}`);
    res.json({ message: 'Merci pour votre avis !' });
  } catch (err) {
    logger.error('[REVIEW] submitReview :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// ── Avis du chauffeur connecté (dashboard) ────────────────────────────────────
exports.getDriverReviews = async (req, res) => {
  try {
    const driverId = req.driver.id;
    const page     = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit    = Math.min(parseInt(req.query.limit || '20', 10), 50);
    const offset   = (page - 1) * limit;

    const { count, rows } = await Review.findAndCountAll({
      where: { chauffeurId: driverId },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      attributes: ['id', 'rating', 'comment', 'clientName', 'createdAt'],
      include: [{
        model: Reservation,
        as: 'reservation',
        attributes: ['reservationNumber', 'date', 'departureAddress', 'arrivalAddress'],
      }],
    });

    // Moyenne et répartition
    const allRatings = await Review.findAll({
      where: { chauffeurId: driverId },
      attributes: [[fn('AVG', col('rating')), 'avg'], [fn('COUNT', col('id')), 'total']],
      raw: true,
    });
    const avg   = parseFloat(allRatings[0]?.avg || 0);
    const total = parseInt(allRatings[0]?.total || 0, 10);

    // Répartition 1→5
    const dist = await Review.findAll({
      where: { chauffeurId: driverId },
      attributes: ['rating', [fn('COUNT', col('id')), 'count']],
      group: ['rating'],
      raw: true,
    });
    const distribution = [1, 2, 3, 4, 5].map(n => ({
      rating: n,
      count:  parseInt(dist.find(d => parseInt(d.rating) === n)?.count || 0, 10),
    }));

    res.json({
      reviews: rows,
      total,
      pages: Math.ceil(total / limit),
      page,
      average: Math.round(avg * 10) / 10,
      distribution,
    });
  } catch (err) {
    logger.error('[REVIEW] getDriverReviews :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// ── Avis globaux (admin) ──────────────────────────────────────────────────────
exports.getAdminReviews = async (req, res) => {
  try {
    const page   = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit  = Math.min(parseInt(req.query.limit || '25', 10), 100);
    const offset = (page - 1) * limit;

    const { count, rows } = await Review.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      include: [{
        model: Driver,
        as: 'chauffeur',
        attributes: ['name', 'email'],
      }, {
        model: Reservation,
        as: 'reservation',
        attributes: ['reservationNumber', 'date'],
      }],
    });

    const allRatings = await Review.findAll({
      attributes: [[fn('AVG', col('rating')), 'avg'], [fn('COUNT', col('id')), 'total']],
      raw: true,
    });

    res.json({
      reviews: rows,
      total: count,
      pages: Math.ceil(count / limit),
      page,
      average: Math.round(parseFloat(allRatings[0]?.avg || 0) * 10) / 10,
    });
  } catch (err) {
    logger.error('[REVIEW] getAdminReviews :', err.message);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};
