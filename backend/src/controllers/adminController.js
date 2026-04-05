const { Op, fn, col, literal } = require('sequelize');
const { Driver, Reservation, sequelize } = require('../models');
const logger = require('../middleware/logger');

// ── Statistiques globales plateforme ─────────────────────────────────────────

exports.getGlobalStats = async (req, res) => {
  try {
    // Comptes chauffeurs par statut
    const driverCounts = await Driver.findAll({
      where: { role: 'driver' },
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    });

    const byStatus = { trial: 0, active: 0, suspended: 0, expired: 0 };
    driverCounts.forEach(r => { byStatus[r.status] = parseInt(r.count, 10); });
    const totalDrivers = Object.values(byStatus).reduce((a, b) => a + b, 0);

    // Réservations globales
    const totalReservations = await Reservation.count();
    const completedReservations = await Reservation.count({ where: { status: 'completed' } });
    const pendingReservations   = await Reservation.count({ where: { status: 'pending' } });

    // Revenus globaux (somme des courses complétées avec prix réel)
    const revenueResult = await Reservation.findOne({
      where: { status: 'completed', price: { [Op.not]: null } },
      attributes: [[fn('SUM', col('price')), 'total']],
      raw: true,
    });
    const totalRevenue = parseFloat(revenueResult?.total || 0);

    // Revenus du mois en cours
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthRevenueResult = await Reservation.findOne({
      where: {
        status: 'completed',
        price: { [Op.not]: null },
        updatedAt: { [Op.gte]: startOfMonth },
      },
      attributes: [[fn('SUM', col('price')), 'total']],
      raw: true,
    });
    const monthRevenue = parseFloat(monthRevenueResult?.total || 0);

    res.json({
      drivers: { total: totalDrivers, byStatus },
      reservations: { total: totalReservations, completed: completedReservations, pending: pendingReservations },
      revenue: { total: totalRevenue, month: monthRevenue },
    });
  } catch (err) {
    logger.error('Erreur adminController.getGlobalStats', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// ── Liste de tous les chauffeurs ──────────────────────────────────────────────

exports.getDrivers = async (req, res) => {
  try {
    const page   = Math.max(parseInt(req.query.page  || '1',  10), 1);
    const limit  = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const offset = (page - 1) * limit;
    const search = req.query.search?.trim() || '';
    const status = req.query.status || 'all';

    const where = { role: 'driver' };
    if (status !== 'all') where.status = status;
    if (search) {
      where[Op.or] = [
        { name:  { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows: drivers } = await Driver.findAndCountAll({
      where,
      attributes: [
        'id', 'name', 'email', 'phone', 'role', 'status', 'plan',
        'trialEndDate', 'subscriptionStatus', 'slug', 'businessName', 'createdAt',
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    // Enrichir avec nb réservations + revenus par chauffeur
    const enriched = await Promise.all(drivers.map(async (d) => {
      const [reservationCount, revenueResult] = await Promise.all([
        Reservation.count({ where: { chauffeur_id: d.id } }),
        Reservation.findOne({
          where: { chauffeur_id: d.id, status: 'completed', price: { [Op.not]: null } },
          attributes: [[fn('SUM', col('price')), 'total']],
          raw: true,
        }),
      ]);
      return {
        ...d.toJSON(),
        reservationCount,
        totalRevenue: parseFloat(revenueResult?.total || 0),
      };
    }));

    res.json({
      drivers: enriched,
      total: count,
      pages: Math.ceil(count / limit),
      page,
    });
  } catch (err) {
    logger.error('Erreur adminController.getDrivers', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// ── Modifier le statut d'un chauffeur ─────────────────────────────────────────

exports.updateDriverStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ['trial', 'active', 'suspended', 'expired'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Statut invalide. Valeurs acceptées : ${allowed.join(', ')}.` });
    }

    const driver = await Driver.findOne({ where: { id, role: 'driver' } });
    if (!driver) {
      return res.status(404).json({ error: 'Chauffeur introuvable.' });
    }

    await driver.update({ status });

    logger.info(`[Admin] Statut chauffeur ${driver.email} → ${status} (par admin ${req.driver.id})`);

    res.json({
      message: `Statut mis à jour : ${status}`,
      driver: {
        id: driver.id, name: driver.name, email: driver.email, status: driver.status,
      },
    });
  } catch (err) {
    logger.error('Erreur adminController.updateDriverStatus', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};
