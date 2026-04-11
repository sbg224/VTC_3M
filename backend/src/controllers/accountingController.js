/**
 * accountingController.js
 * Module de comptabilité simplifiée — sans fiscalité ni charges sociales.
 * Logique : CA brut (courses terminées) → commission plateforme → net à reverser.
 */

const { Op, fn, col } = require('sequelize');
const { Driver, Reservation } = require('../models');
const logger = require('../middleware/logger');
const { generateBordereauPdf } = require('../services/pdfService');

// ── Helpers période ───────────────────────────────────────────────────────────

function padDate(d) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function monthLabel(d) {
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function weekLabel(from, to) {
  const fmt = (d) => d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  return `Semaine du ${fmt(from)} au ${fmt(to)}`;
}

/**
 * Calcule les bornes de la période demandée.
 * @returns {{ from: string, to: string, label: string }}  — dates en YYYY-MM-DD
 */
function getPeriodDates(period, startDate, endDate) {
  const now = new Date();

  switch (period) {
    case 'week': {
      const d = new Date(now);
      const day = d.getDay();               // 0=dim, 1=lun…
      const diffToMon = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diffToMon);
      d.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setDate(d.getDate() + 6);
      return { from: padDate(d), to: padDate(end), label: weekLabel(d, end) };
    }

    case 'month': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: padDate(from), to: padDate(to), label: monthLabel(from) };
    }

    case 'prev_month': {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to   = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: padDate(from), to: padDate(to), label: monthLabel(from) };
    }

    case 'custom': {
      if (!startDate || !endDate) throw new Error('startDate et endDate requis pour la période personnalisée.');
      return { from: startDate, to: endDate, label: `${startDate} → ${endDate}` };
    }

    default: {
      // Par défaut : mois en cours
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: padDate(from), to: padDate(to), label: monthLabel(from) };
    }
  }
}

/**
 * Calcule les montants comptables d'un chauffeur.
 */
function computeAmounts(grossRevenue, commissionRate) {
  const gross      = parseFloat(grossRevenue || 0);
  const rate       = parseFloat(commissionRate || 20);
  const commission = Math.round(gross * rate / 100 * 100) / 100;
  const net        = Math.round((gross - commission) * 100) / 100;
  return { gross, rate, commission, net };
}

// ── Résumé comptable — tous chauffeurs ────────────────────────────────────────

exports.getAccountingSummary = async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    const periodData = getPeriodDates(period, startDate, endDate);

    // Tous les chauffeurs actifs (hors admin)
    const drivers = await Driver.findAll({
      where: { role: 'driver' },
      attributes: ['id', 'name', 'email', 'phone', 'businessName', 'status', 'commissionRate'],
      order: [['name', 'ASC']],
    });

    // Courses terminées par chauffeur pour la période
    const ridesRaw = await Reservation.findAll({
      where: {
        status: 'completed',
        price: { [Op.not]: null },
        date: { [Op.between]: [periodData.from, periodData.to] },
      },
      attributes: [
        'chauffeur_id',
        [fn('COUNT', col('id')),    'rideCount'],
        [fn('SUM',   col('price')), 'grossRevenue'],
      ],
      group: ['chauffeur_id'],
      raw: true,
    });

    // Indexer par chauffeur_id
    const ridesMap = {};
    ridesRaw.forEach(r => { ridesMap[r.chauffeur_id] = r; });

    // Construire le résumé
    const summary = drivers.map(d => {
      const raw = ridesMap[d.id] || {};
      const amounts = computeAmounts(raw.grossRevenue, d.commissionRate);
      return {
        id:             d.id,
        name:           d.name,
        email:          d.email,
        businessName:   d.businessName,
        status:         d.status,
        commissionRate: d.commissionRate,
        rideCount:      parseInt(raw.rideCount || 0, 10),
        grossRevenue:   amounts.gross,
        commissionAmount: amounts.commission,
        netAmount:      amounts.net,
      };
    });

    // Totaux plateforme
    const totals = summary.reduce(
      (acc, d) => ({
        rideCount:        acc.rideCount      + d.rideCount,
        grossRevenue:     acc.grossRevenue   + d.grossRevenue,
        commissionAmount: acc.commissionAmount + d.commissionAmount,
        netAmount:        acc.netAmount      + d.netAmount,
      }),
      { rideCount: 0, grossRevenue: 0, commissionAmount: 0, netAmount: 0 }
    );
    totals.grossRevenue    = Math.round(totals.grossRevenue    * 100) / 100;
    totals.commissionAmount= Math.round(totals.commissionAmount* 100) / 100;
    totals.netAmount       = Math.round(totals.netAmount       * 100) / 100;

    res.json({ period: periodData, summary, totals });
  } catch (err) {
    logger.error('Erreur accountingController.getAccountingSummary', { error: err.message });
    res.status(err.message.includes('requis') ? 400 : 500).json({ error: err.message });
  }
};

// ── Détail d'un chauffeur pour la période ─────────────────────────────────────

exports.getDriverStatement = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { period, startDate, endDate } = req.query;
    const periodData = getPeriodDates(period, startDate, endDate);

    const driver = await Driver.findOne({
      where: { id: driverId, role: 'driver' },
      attributes: ['id', 'name', 'email', 'phone', 'businessName', 'siret', 'commissionRate'],
    });
    if (!driver) return res.status(404).json({ error: 'Chauffeur introuvable.' });

    const rides = await Reservation.findAll({
      where: {
        chauffeur_id: driverId,
        status: 'completed',
        price: { [Op.not]: null },
        date: { [Op.between]: [periodData.from, periodData.to] },
      },
      attributes: ['id', 'reservationNumber', 'date', 'time', 'departureAddress', 'arrivalAddress', 'distance', 'price', 'passengers'],
      order: [['date', 'ASC'], ['time', 'ASC']],
    });

    const grossRevenue = rides.reduce((sum, r) => sum + parseFloat(r.price || 0), 0);
    const amounts = computeAmounts(grossRevenue, driver.commissionRate);

    res.json({
      period: periodData,
      driver: driver.toJSON(),
      rides,
      summary: {
        rideCount:       rides.length,
        grossRevenue:    amounts.gross,
        commissionRate:  amounts.rate,
        commissionAmount:amounts.commission,
        netAmount:       amounts.net,
      },
    });
  } catch (err) {
    logger.error('Erreur accountingController.getDriverStatement', { error: err.message });
    res.status(500).json({ error: err.message });
  }
};

// ── Génération du PDF Bordereau de versement ──────────────────────────────────

exports.generateStatementPdf = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { period, startDate, endDate } = req.query;
    const periodData = getPeriodDates(period, startDate, endDate);

    const driver = await Driver.findOne({
      where: { id: driverId, role: 'driver' },
      attributes: ['id', 'name', 'email', 'phone', 'businessName', 'siret', 'commissionRate'],
    });
    if (!driver) return res.status(404).json({ error: 'Chauffeur introuvable.' });

    const rides = await Reservation.findAll({
      where: {
        chauffeur_id: driverId,
        status: 'completed',
        price: { [Op.not]: null },
        date: { [Op.between]: [periodData.from, periodData.to] },
      },
      attributes: ['id', 'reservationNumber', 'date', 'time', 'departureAddress', 'arrivalAddress', 'distance', 'price'],
      order: [['date', 'ASC'], ['time', 'ASC']],
    });

    const grossRevenue = rides.reduce((sum, r) => sum + parseFloat(r.price || 0), 0);
    const amounts = computeAmounts(grossRevenue, driver.commissionRate);

    const statementData = {
      period: periodData,
      driver: driver.toJSON(),
      rides,
      summary: {
        rideCount:        rides.length,
        grossRevenue:     amounts.gross,
        commissionRate:   amounts.rate,
        commissionAmount: amounts.commission,
        netAmount:        amounts.net,
      },
      generatedBy: req.driver?.name || 'Administration',
      generatedAt: new Date(),
    };

    const { filepath, filename } = await generateBordereauPdf(statementData);

    logger.info(`[ACCOUNTING] Bordereau généré pour ${driver.name} (${periodData.label})`);

    res.download(filepath, filename, (err) => {
      if (err) logger.error('[ACCOUNTING] Erreur download PDF', { error: err.message });
    });
  } catch (err) {
    logger.error('Erreur accountingController.generateStatementPdf', { error: err.message });
    res.status(500).json({ error: err.message });
  }
};

// ── Mettre à jour le taux de commission d'un chauffeur ────────────────────────

exports.updateDriverCommission = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { commissionRate } = req.body;

    const rate = parseFloat(commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      return res.status(400).json({ error: 'commissionRate invalide (doit être entre 0 et 100).' });
    }

    const driver = await Driver.findOne({ where: { id: driverId, role: 'driver' } });
    if (!driver) return res.status(404).json({ error: 'Chauffeur introuvable.' });

    await driver.update({ commissionRate: rate });

    logger.info(`[ACCOUNTING] Commission ${driver.name} → ${rate}% (par ${req.driver?.email})`);
    res.json({ message: `Taux de commission mis à jour : ${rate}%`, commissionRate: rate });
  } catch (err) {
    logger.error('Erreur accountingController.updateDriverCommission', { error: err.message });
    res.status(500).json({ error: err.message });
  }
};
