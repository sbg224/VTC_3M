const { fn, col, literal, Op } = require('sequelize');
const { Reservation } = require('../models');
const logger = require('../middleware/logger');
const { formatDateShort: formatDate } = require('../utils/dateFormat');
const { likeContains } = require('../utils/search');

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildWhere(driverId, search) {
  const base = { chauffeurId: driverId };
  if (!search) return base;
  return {
    ...base,
    [Op.or]: [
      likeContains('email', search),
      likeContains('firstName', search),
      likeContains('lastName', search),
    ],
  };
}

const CLIENT_ATTRIBUTES = [
  'email',
  [fn('MAX', col('firstName')),    'firstName'],
  [fn('MAX', col('lastName')),     'lastName'],
  [fn('MAX', col('phone')),        'phone'],
  [fn('COUNT', col('id')),         'totalReservations'],
  [fn('SUM', literal("CASE WHEN status = 'completed' THEN 1 ELSE 0 END")),                           'completedReservations'],
  [fn('SUM', literal("CASE WHEN status = 'completed' AND price IS NOT NULL THEN CAST(price AS REAL) ELSE 0 END")), 'totalSpent'],
  [fn('MAX', col('date')),         'lastReservationDate'],
  [fn('MIN', col('createdAt')),    'firstReservationDate'],
];

// ── Liste des clients (paginée + recherche) ───────────────────────────────────

exports.getClients = async (req, res) => {
  try {
    const driverId = req.driver.id;
    const page   = Math.max(parseInt(req.query.page  || '1',  10), 1);
    const limit  = Math.min(parseInt(req.query.limit || '20', 10), 100);
    const offset = (page - 1) * limit;
    const search = req.query.search?.trim() || '';

    const where = buildWhere(driverId, search);

    // Compter les clients uniques (par email)
    const countResult = await Reservation.findAll({
      where,
      attributes: ['email'],
      group: ['email'],
      raw: true,
    });
    const total = countResult.length;

    // Récupérer les clients avec agrégations
    const rows = await Reservation.findAll({
      where,
      attributes: CLIENT_ATTRIBUTES,
      group: ['email'],
      order: [[fn('MAX', col('createdAt')), 'DESC']],
      limit,
      offset,
      raw: true,
    });

    const clients = rows.map(r => ({
      email:                 r.email,
      firstName:             r.firstName || '',
      lastName:              r.lastName  || '',
      phone:                 r.phone     || '',
      fullName:              `${r.firstName || ''} ${r.lastName || ''}`.trim(),
      totalReservations:     parseInt(r.totalReservations,     10) || 0,
      completedReservations: parseInt(r.completedReservations, 10) || 0,
      totalSpent:            parseFloat(r.totalSpent || 0),
      lastReservationDate:   r.lastReservationDate  || null,
      firstReservationDate:  r.firstReservationDate || null,
    }));

    res.json({
      clients,
      total,
      pages: Math.ceil(total / limit),
      page,
    });
  } catch (err) {
    logger.error('Erreur crmController.getClients', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// ── Export CSV ────────────────────────────────────────────────────────────────

exports.exportCsv = async (req, res) => {
  try {
    const driverId = req.driver.id;
    const search   = req.query.search?.trim() || '';
    const where    = buildWhere(driverId, search);

    const rows = await Reservation.findAll({
      where,
      attributes: CLIENT_ATTRIBUTES,
      group: ['email'],
      order: [[fn('MAX', col('createdAt')), 'DESC']],
      raw: true,
    });

    const headers = [
      'Nom complet', 'Email', 'Téléphone',
      'Nb réservations', 'Courses terminées',
      'Total dépensé (€)', 'Première réservation', 'Dernière réservation',
    ];

    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

    const lines = [
      headers.map(escape).join(';'),
      ...rows.map(r => [
        escape(`${r.firstName || ''} ${r.lastName || ''}`.trim()),
        escape(r.email),
        escape(r.phone || ''),
        r.totalReservations     || 0,
        r.completedReservations || 0,
        parseFloat(r.totalSpent || 0).toFixed(2),
        formatDate(r.firstReservationDate),
        formatDate(r.lastReservationDate),
      ].join(';')),
    ];

    const csv = '\uFEFF' + lines.join('\r\n'); // BOM UTF-8 pour Excel

    const filename = `crm-clients-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type',        'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);

    logger.info(`[CRM] Export CSV – ${rows.length} clients – driver ${driverId}`);
  } catch (err) {
    logger.error('Erreur crmController.exportCsv', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};
