const { Reservation } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const logger = require('../middleware/logger');

exports.getStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear  = new Date(now.getFullYear(), 0, 1);

    // ── Isolation multi-tenant : toutes les requêtes filtrées par chauffeur ──
    const driverId = req.driver.id;
    const baseWhere = { chauffeur_id: driverId };

    // Compteurs par statut
    const [total, pending, confirmed, completed, cancelled] = await Promise.all([
      Reservation.count({ where: { ...baseWhere } }),
      Reservation.count({ where: { ...baseWhere, status: 'pending' } }),
      Reservation.count({ where: { ...baseWhere, status: 'confirmed' } }),
      Reservation.count({ where: { ...baseWhere, status: 'completed' } }),
      Reservation.count({ where: { ...baseWhere, status: 'cancelled' } }),
    ]);

    // Revenus
    const revenueAllTime = await Reservation.sum('price', {
      where: { ...baseWhere, status: 'completed' },
    });
    const revenueMonth = await Reservation.sum('price', {
      where: { ...baseWhere, status: 'completed', createdAt: { [Op.gte]: startOfMonth } },
    });
    const revenueYear = await Reservation.sum('price', {
      where: { ...baseWhere, status: 'completed', createdAt: { [Op.gte]: startOfYear } },
    });

    // Réservations ce mois
    const reservationsThisMonth = await Reservation.count({
      where: { ...baseWhere, createdAt: { [Op.gte]: startOfMonth } },
    });

    // Réservations des 7 derniers jours (pour graphique)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end   = new Date(d.setHours(23, 59, 59, 999));
      const count = await Reservation.count({
        where: { ...baseWhere, createdAt: { [Op.between]: [start, end] } },
      });
      last7Days.push({ date: start.toISOString().split('T')[0], count });
    }

    // Dernières réservations du chauffeur
    const latestReservations = await Reservation.findAll({
      where: { ...baseWhere },
      order: [['createdAt', 'DESC']],
      limit: 5,
    });

    logger.info(`Stats consultées par ${req.driver.email}`);

    res.json({
      counts: { total, pending, confirmed, completed, cancelled },
      revenue: {
        allTime: revenueAllTime || 0,
        month:   revenueMonth   || 0,
        year:    revenueYear    || 0,
      },
      reservationsThisMonth,
      last7Days,
      latestReservations,
    });
  } catch (err) {
    logger.error(`Erreur stats : ${err.message}`);
    res.status(500).json({ error: 'Erreur lors du chargement des statistiques.' });
  }
};
