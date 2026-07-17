const { Reservation, Review } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const logger = require('../middleware/logger');

// ── Stats publiques (pas de JWT) — homepage ───────────────────────────────────
exports.getPublicStats = async (req, res) => {
  try {
    // Courses effectuées (toutes complétées, tous chauffeurs confondus)
    const totalCompleted = await Reservation.count({
      where: { status: 'completed' },
    });

    // Clients uniques (emails distincts sur toutes les réservations)
    const uniqueClientsResult = await Reservation.count({
      distinct: true,
      col: 'email',
    });

    // Première réservation en base → calcul ancienneté
    const firstReservation = await Reservation.findOne({
      order: [['createdAt', 'ASC']],
      attributes: ['createdAt'],
    });

    let yearsActive = 0;
    if (firstReservation) {
      const startYear  = new Date(firstReservation.createdAt).getFullYear();
      const currentYear = new Date().getFullYear();
      yearsActive = currentYear - startYear;
    }
    // Fallback : variable d'environnement COMPANY_START_YEAR
    if (yearsActive === 0 && process.env.COMPANY_START_YEAR) {
      yearsActive = new Date().getFullYear() - parseInt(process.env.COMPANY_START_YEAR);
    }

    res.json({
      totalCompleted,
      uniqueClients: uniqueClientsResult,
      yearsActive,
      availability: '24/7',
    });
  } catch (err) {
    logger.error(`[PUBLIC STATS] Erreur : ${err.message}`);
    res.status(500).json({ error: 'Erreur lors du chargement des statistiques publiques.' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear  = new Date(now.getFullYear(), 0, 1);

    // ── Isolation multi-tenant : toutes les requêtes filtrées par chauffeur ──
    const driverId = req.driver.id;
    const baseWhere = { chauffeurId: driverId };

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

    // ── Comparaison mois précédent (M-1) ─────────────────────────────────────
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [ridesThisMonth, ridesPrevMonth, revPrevMonth, completedThisMonth, completedPrevMonth] = await Promise.all([
      Reservation.count({ where: { ...baseWhere, status: 'completed', updatedAt: { [Op.gte]: startOfMonth } } }),
      Reservation.count({ where: { ...baseWhere, status: 'completed', updatedAt: { [Op.between]: [startOfPrevMonth, endOfPrevMonth] } } }),
      Reservation.sum('price', { where: { ...baseWhere, status: 'completed', updatedAt: { [Op.between]: [startOfPrevMonth, endOfPrevMonth] } } }),
      Reservation.count({ where: { ...baseWhere, status: 'completed', updatedAt: { [Op.gte]: startOfMonth } } }),
      Reservation.count({ where: { ...baseWhere, status: 'completed', updatedAt: { [Op.between]: [startOfPrevMonth, endOfPrevMonth] } } }),
    ]);

    const delta = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    // ── Avis clients ──────────────────────────────────────────────────────────
    let reviewAverage = 0;
    let reviewCount   = 0;
    try {
      const reviewStats = await Review.findAll({
        where: { chauffeurId: driverId },
        attributes: [[fn('AVG', col('rating')), 'avg'], [fn('COUNT', col('id')), 'total']],
        raw: true,
      });
      reviewAverage = Math.round(parseFloat(reviewStats[0]?.avg || 0) * 10) / 10;
      reviewCount   = parseInt(reviewStats[0]?.total || 0, 10);
    } catch { /* table inexistante au premier démarrage */ }

    // Réservations des 7 derniers jours (pour graphique) — bornes calculées
    // d'abord, puis les 7 comptages lancés en parallèle (étaient séquentiels).
    const dayRanges = Array.from({ length: 7 }, (_, idx) => {
      const i = 6 - idx;
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end   = new Date(d.setHours(23, 59, 59, 999));
      return { start, end };
    });
    const dayCounts = await Promise.all(dayRanges.map(({ start, end }) =>
      Reservation.count({ where: { ...baseWhere, createdAt: { [Op.between]: [start, end] } } })
    ));
    const last7Days = dayRanges.map(({ start }, idx) => ({
      date: start.toISOString().split('T')[0],
      count: dayCounts[idx],
    }));

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
        allTime:   revenueAllTime || 0,
        month:     revenueMonth   || 0,
        prevMonth: revPrevMonth   || 0,
        year:      revenueYear    || 0,
      },
      reservationsThisMonth,
      performance: {
        ridesThisMonth,
        ridesPrevMonth,
        ridesDelta:    delta(ridesThisMonth, ridesPrevMonth),
        revenueMonth:  revenueMonth  || 0,
        revenuePrev:   revPrevMonth  || 0,
        revenueDelta:  delta(revenueMonth || 0, revPrevMonth || 0),
      },
      reviews: {
        average: reviewAverage,
        count:   reviewCount,
      },
      last7Days,
      latestReservations,
    });
  } catch (err) {
    logger.error(`Erreur stats : ${err.message}`);
    res.status(500).json({ error: 'Erreur lors du chargement des statistiques.' });
  }
};
