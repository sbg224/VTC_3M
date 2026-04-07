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

    const allowed = ['pending', 'trial', 'active', 'suspended', 'expired'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Statut invalide. Valeurs acceptées : ${allowed.join(', ')}.` });
    }

    const driver = await Driver.findOne({ where: { id, role: 'driver' } });
    if (!driver) {
      return res.status(404).json({ error: 'Chauffeur introuvable.' });
    }

    // Quand l'admin valide (→ trial), on démarre le compte à rebours des 14 jours
    const updateData = { status };
    if (status === 'trial' && !driver.trialEndDate) {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);
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
      Reservation.count({ where: { chauffeur_id: id } }),
      Reservation.count({ where: { chauffeur_id: id, status: 'completed' } }),
      Reservation.count({ where: { chauffeur_id: id, status: 'pending' } }),
      Reservation.findOne({
        where: { chauffeur_id: id, status: 'completed', price: { [Op.not]: null } },
        attributes: [[fn('SUM', col('price')), 'total']],
        raw: true,
      }),
      Reservation.findAll({
        where: { chauffeur_id: id },
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
    if (driverId)            where.chauffeur_id = driverId;
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

    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from:    `"3M Drive Admin" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
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
    res.status(500).json({ error: 'Erreur lors de l\'envoi de la notification.' });
  }
};
