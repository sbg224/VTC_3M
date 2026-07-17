const { Op, fn, col, literal } = require('sequelize');
const { Driver, Reservation, PricingConfig, sequelize } = require('../models');
const logger = require('../middleware/logger');
const { updatePricingCache, getPricingValues } = require('../services/priceService');
const { emailsEnabled, createTransporter } = require('../services/emailService');
const { TRIAL_DURATION_DAYS } = require('../utils/constants');

// Ne jamais renvoyer un message d'erreur interne brut (détails SMTP, requête…)
// au client en production — seul le log en garde la trace.
const safeMessage = (err) => (process.env.NODE_ENV === 'production' ? 'Erreur interne du serveur.' : err.message);

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

    const byStatus = { pending: 0, trial: 0, active: 0, suspended: 0, expired: 0 };
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

    // Enrichir avec nb réservations + revenus par chauffeur — une seule
    // requête groupée pour toute la page (jusqu'à 100 chauffeurs) plutôt que
    // 2 requêtes par chauffeur (jusqu'à 200 requêtes SQL pour une page admin).
    const driverIds = drivers.map((d) => d.id);
    const statsRows = driverIds.length
      ? await Reservation.findAll({
          where: { chauffeurId: { [Op.in]: driverIds } },
          attributes: [
            'chauffeurId',
            [fn('COUNT', col('id')), 'reservationCount'],
            [fn('SUM', literal("CASE WHEN status = 'completed' AND price IS NOT NULL THEN price ELSE 0 END")), 'totalRevenue'],
          ],
          group: ['chauffeurId'],
          raw: true,
        })
      : [];
    const statsByDriver = new Map(statsRows.map((r) => [r.chauffeurId, r]));

    const enriched = drivers.map((d) => {
      const stats = statsByDriver.get(d.id);
      return {
        ...d.toJSON(),
        reservationCount: parseInt(stats?.reservationCount || 0, 10),
        totalRevenue: parseFloat(stats?.totalRevenue || 0),
      };
    });

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

    const allowed = ['pending', 'trial', 'active', 'suspended', 'expired'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Statut invalide. Valeurs acceptées : ${allowed.join(', ')}.` });
    }

    const driver = await Driver.findOne({ where: { id, role: 'driver' } });
    if (!driver) {
      return res.status(404).json({ error: 'Chauffeur introuvable.' });
    }

    // Quand l'admin valide (→ trial), on démarre le compte à rebours de l'essai
    const updateData = { status };
    if (status === 'trial' && !driver.trialEndDate) {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + TRIAL_DURATION_DAYS);
      updateData.trialEndDate = trialEnd;
      logger.info(`[Admin] Essai démarré pour ${driver.email} jusqu'au ${trialEnd.toISOString()}`);
    }

    await driver.update(updateData);

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

// ── Détail d'un chauffeur (stats + dernières réservations) ────────────────────

exports.getDriverDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const driver = await Driver.findOne({
      where: { id, role: 'driver' },
      attributes: ['id','name','email','phone','status','plan','trialEndDate','subscriptionStatus','slug','businessName','siret','vtcCardNumber','createdAt'],
    });
    if (!driver) return res.status(404).json({ error: 'Chauffeur introuvable.' });

    const [
      totalReservations,
      completedRes,
      pendingRes,
      revenueResult,
      recentRes,
    ] = await Promise.all([
      Reservation.count({ where: { chauffeurId: id } }),
      Reservation.count({ where: { chauffeurId: id, status: 'completed' } }),
      Reservation.count({ where: { chauffeurId: id, status: 'pending' } }),
      Reservation.findOne({
        where: { chauffeurId: id, status: 'completed', price: { [Op.not]: null } },
        attributes: [[fn('SUM', col('price')), 'total']],
        raw: true,
      }),
      Reservation.findAll({
        where: { chauffeurId: id },
        order: [['createdAt', 'DESC']],
        limit: 10,
        attributes: ['id','reservationNumber','firstName','lastName','departureAddress','arrivalAddress','date','time','status','price','estimatedPrice','createdAt'],
      }),
    ]);

    res.json({
      driver: driver.toJSON(),
      stats: {
        totalReservations,
        completedReservations: completedRes,
        pendingReservations:   pendingRes,
        totalRevenue: parseFloat(revenueResult?.total || 0),
      },
      recentReservations: recentRes,
    });
  } catch (err) {
    logger.error('Erreur adminController.getDriverDetail', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// ── Toutes les réservations (admin — tous chauffeurs) ─────────────────────────

exports.getAllReservations = async (req, res) => {
  try {
    const page      = Math.max(parseInt(req.query.page  || '1',  10), 1);
    const limit     = Math.min(parseInt(req.query.limit || '25', 10), 100);
    const offset    = (page - 1) * limit;
    const status    = req.query.status    || 'all';
    const driverId  = req.query.driverId  || null;
    const search    = req.query.search?.trim() || '';
    const dateFrom  = req.query.dateFrom  || null;
    const dateTo    = req.query.dateTo    || null;

    const where = {};
    if (status   !== 'all') where.status = status;
    if (driverId)            where.chauffeurId = driverId;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date[Op.gte] = dateFrom;
      if (dateTo)   where.date[Op.lte] = dateTo;
    }
    if (search) {
      where[Op.or] = [
        { firstName:        { [Op.like]: `%${search}%` } },
        { lastName:         { [Op.like]: `%${search}%` } },
        { email:            { [Op.like]: `%${search}%` } },
        { reservationNumber:{ [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Reservation.findAndCountAll({
      where,
      include: [{
        model: Driver,
        as: 'chauffeur',
        attributes: ['id','name','email','slug'],
      }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      reservations: rows,
      total: count,
      pages: Math.ceil(count / limit),
      page,
    });
  } catch (err) {
    logger.error('Erreur adminController.getAllReservations', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// ── CRM Clients globaux ───────────────────────────────────────────────────────

exports.getGlobalClients = async (req, res) => {
  try {
    const page   = Math.max(parseInt(req.query.page  || '1',  10), 1);
    const limit  = Math.min(parseInt(req.query.limit || '25', 10), 100);
    const offset = (page - 1) * limit;
    const search = req.query.search?.trim() || '';

    const where = {};
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName:  { [Op.like]: `%${search}%` } },
        { email:     { [Op.like]: `%${search}%` } },
      ];
    }

    // Agrège par email : compte réservations + montant total + dernière réservation
    const clients = await Reservation.findAll({
      where,
      attributes: [
        'email', 'firstName', 'lastName', 'phone',
        [fn('COUNT', col('id')),        'reservationCount'],
        [fn('SUM',   col('price')),     'totalSpent'],
        [fn('MAX',   col('createdAt')), 'lastReservation'],
      ],
      group: ['email'],
      order: [[literal('lastReservation'), 'DESC']],
      limit,
      offset,
      raw: true,
    });

    const total = await Reservation.count({
      attributes: ['email'],
      group: ['email'],
      where,
    });

    res.json({
      clients,
      total: total.length,
      pages: Math.ceil(total.length / limit),
      page,
    });
  } catch (err) {
    logger.error('Erreur adminController.getGlobalClients', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// ── Envoyer une notification email à un chauffeur ─────────────────────────────

exports.notifyDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, message } = req.body;

    const driver = await Driver.findOne({ where: { id, role: 'driver' } });
    if (!driver) return res.status(404).json({ error: 'Chauffeur introuvable.' });

    if (!emailsEnabled()) {
      logger.warn(`[EMAIL] Envoi désactivé par EMAIL_ENABLED=false (notification admin -> ${driver.email})`);
      return res.json({ message: `Email non envoyé — EMAIL_ENABLED=false (mode développement).` });
    }

    const transporter = createTransporter();

    await transporter.sendMail({
      from:    `"3M Drive Admin" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to:      driver.email,
      subject: subject || 'Message de l\'administration 3M Drive',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#16100A;padding:24px;border-bottom:2px solid #D4AF37;">
            <h2 style="color:#D4AF37;margin:0;">3M Drive — Administration</h2>
          </div>
          <div style="padding:28px;background:#ffffff;">
            <p>Bonjour <strong>${driver.name}</strong>,</p>
            <div style="white-space:pre-wrap;line-height:1.7;color:#374151;">${message}</div>
            <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;" />
            <p style="font-size:0.85rem;color:#6b7280;">
              Ce message vous a été envoyé par l'équipe 3M Drive.<br/>
              Pour toute question, contactez-nous à l'adresse indiquée dans votre espace chauffeur.
            </p>
          </div>
        </div>
      `,
    });

    logger.info(`[Admin] Notification envoyée à ${driver.email} (sujet: "${subject}")`);
    res.json({ message: `Email envoyé à ${driver.email}` });
  } catch (err) {
    logger.error('Erreur adminController.notifyDriver', { error: err.message });
    res.status(500).json({ error: `Erreur lors de l'envoi : ${safeMessage(err)}` });
  }
};

// ── Tarification dynamique ────────────────────────────────────────────────────

exports.getPricing = async (req, res) => {
  try {
    // Récupère (ou crée) la config tarifaire singleton (id=1)
    let config = await PricingConfig.findByPk(1);
    if (!config) {
      const current = getPricingValues();
      config = await PricingConfig.create({
        id:           1,
        pricePerKm:   current.PRICE_PER_KM,
        minimumPrice: current.MINIMUM_PRICE,
        baseFee:      current.BASE_FEE,
        updatedBy:    'system',
      });
    }
    res.json({
      pricePerKm:   config.pricePerKm,
      minimumPrice: config.minimumPrice,
      baseFee:      config.baseFee,
      updatedBy:    config.updatedBy,
      updatedAt:    config.updatedAt,
    });
  } catch (err) {
    logger.error('Erreur adminController.getPricing', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

exports.updatePricing = async (req, res) => {
  try {
    const { pricePerKm, minimumPrice, baseFee } = req.body;

    // Validation des valeurs
    if (pricePerKm !== undefined && (isNaN(pricePerKm) || pricePerKm < 0)) {
      return res.status(400).json({ error: 'pricePerKm invalide (doit être >= 0).' });
    }
    if (minimumPrice !== undefined && (isNaN(minimumPrice) || minimumPrice < 0)) {
      return res.status(400).json({ error: 'minimumPrice invalide (doit être >= 0).' });
    }
    if (baseFee !== undefined && (isNaN(baseFee) || baseFee < 0)) {
      return res.status(400).json({ error: 'baseFee invalide (doit être >= 0).' });
    }

    // Upsert : met à jour la ligne id=1 ou la crée si absente
    const [config] = await PricingConfig.upsert({
      id:           1,
      pricePerKm:   parseFloat(pricePerKm),
      minimumPrice: parseFloat(minimumPrice),
      baseFee:      parseFloat(baseFee),
      updatedBy:    req.driver?.name || req.driver?.email || 'admin',
    });

    // Mise à jour du cache mémoire → effective immédiatement
    updatePricingCache({ pricePerKm, minimumPrice, baseFee });

    logger.info(`[Admin] Tarification mise à jour par ${req.driver?.email}`, {
      pricePerKm, minimumPrice, baseFee,
    });

    res.json({
      message: 'Tarification mise à jour avec succès.',
      pricePerKm:   parseFloat(pricePerKm),
      minimumPrice: parseFloat(minimumPrice),
      baseFee:      parseFloat(baseFee),
      updatedBy:    req.driver?.name || req.driver?.email || 'admin',
      updatedAt:    new Date(),
    });
  } catch (err) {
    logger.error('Erreur adminController.updatePricing', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};
