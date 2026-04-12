require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const hpp     = require('hpp');
const rateLimit = require('express-rate-limit');
const path    = require('path');
const { sequelize } = require('./models');
const { runMigrations } = require('./db/runMigrations');
const logger   = require('./middleware/logger');
const sanitize = require('./middleware/sanitize');

const app  = express();
const PORT = process.env.PORT || 5001;

// ── Sécurité HTTP headers ─────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:'],
      connectSrc: ["'self'"],
      fontSrc:    ["'self'"],
      objectSrc:  ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
const normalizeOrigin = (value) => String(value || '').trim().replace(/\/$/, '');
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);
const isProd = process.env.NODE_ENV === 'production';
const privateDevOriginRegex = /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|100\.\d+\.\d+\.\d+)(:\d+)?$/i;
app.use(cors({
  origin: (origin, cb) => {
    // En production : rejeter toute requête sans header Origin (scripts, curl, etc.)
    if (!origin) {
      if (isProd) {
        logger.warn('[CORS] Requête sans Origin rejetée (production)');
        return cb(new Error('Origine non autorisée par CORS.'));
      }
      // En développement : autoriser les outils comme Postman, curl
      return cb(null, true);
    }
    const normalizedOrigin = normalizeOrigin(origin);
    if (allowedOrigins.includes(normalizedOrigin)) return cb(null, true);
    if (!isProd && privateDevOriginRegex.test(normalizedOrigin)) return cb(null, true);
    logger.warn(`[CORS] Origine bloquée : ${origin}`);
    cb(new Error('Origine non autorisée par CORS.'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Protection HTTP Parameter Pollution ──────────────────────────────────────
app.use(hpp());

// ── Logs HTTP ─────────────────────────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ── Webhook Stripe : body RAW — DOIT être monté AVANT le parser JSON global ───
// Le handler interne de la route gère son propre express.raw()
app.use('/api/billing/webhook', require('./routes/billing'));

// ── Body parsing (limité à 10kb) ──────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Sanitisation XSS sur toutes les entrées ───────────────────────────────────
app.use(sanitize);

// ── Forcer Content-Type JSON sur les routes API POST/PUT ──────────────────────
app.use('/api', (req, res, next) => {
  if (['POST', 'PUT'].includes(req.method) && req.path !== '/' && !req.is('application/json')) {
    return res.status(415).json({ error: 'Content-Type application/json requis.' });
  }
  next();
});

// ── Rate limiting global ──────────────────────────────────────────────────────
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes. Réessayez dans 15 minutes.' },
}));



// ── PDFs : NE PAS servir en statique — les téléchargements passent par
//    /api/reservations/:id/pdf-reservation et /api/reservations/:id/pdf-invoice
//    qui sont protégés par JWT + isolation chauffeur_id.
//    (route statique supprimée pour éviter l'accès public aux PDFs clients)

// ── Routes API ────────────────────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/simulate',     require('./routes/simulate'));
app.use('/api/stats',        require('./routes/stats'));
app.use('/api/billing',      require('./routes/billing'));
app.use('/api/drivers',       require('./routes/drivers'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/admin/accounting', require('./routes/accounting'));
app.use('/api/reviews',          require('./routes/reviews'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/crm',           require('./routes/crm'));

// ── Santé ─────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', version: '1.1.0', timestamp: new Date().toISOString() });
});

// ── Route inconnue ────────────────────────────────────────────────────────────
app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'Route introuvable.' });
});

// ── Gestion d'erreurs globale (signature 4 params requise par Express) ────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  logger.error(`[ERROR] ${err.status || 500} – ${err.message} – ${req.method} ${req.originalUrl} – IP: ${req.ip}`);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Erreur interne du serveur.'
      : err.message,
  });
});

// ── Démarrage ─────────────────────────────────────────────────────────────────
async function start() {
  try {
    await sequelize.authenticate();
    logger.info('[DB] Connexion établie.');

    // sync() sans options = création des tables manquantes uniquement.
    // JAMAIS de force:true en production — cela efface toutes les données.
    // Pour des migrations de schéma, utiliser Sequelize-CLI migrations.
    await sequelize.sync();
    logger.info('[DB] Modèles synchronisés (tables créées si inexistantes).');

    await runMigrations(sequelize, logger);

    // Créer ou mettre à jour le compte admin depuis .env
    const { Driver } = require('./models');
    const bcrypt = require('bcryptjs');
    const adminEmail = process.env.ADMIN_LOGIN_EMAIL || 'admin@vtc3m.fr';
    const adminName  = process.env.ADMIN_NAME        || '3M Services';
    const adminPass  = process.env.ADMIN_PASSWORD    || 'Admin2024!';
    const adminPhone = process.env.ADMIN_PHONE       || '+33600000000';

    let admin = await Driver.findOne({ where: { email: adminEmail } });
    if (!admin) {
      admin = await Driver.findOne({ where: { email: 'admin@vtc3m.fr' } });
    }
    const hashedPass = await bcrypt.hash(adminPass, 12);
    if (admin) {
      await admin.update({
        name:          adminName,
        email:         adminEmail,
        password:      hashedPass,
        phone:         adminPhone,
        role:          'admin',
        status:        'active',
        slug:          null,          // l'admin n'a pas de page publique
        trialEndDate:  null,          // l'admin n'a pas d'essai
        plan:          'free',
        subscriptionStatus: null,
      });
      logger.info(`[AUTH] Compte admin mis à jour : ${adminEmail}`);
    } else {
      await Driver.create({
        name:          adminName,
        email:         adminEmail,
        password:      hashedPass,
        phone:         adminPhone,
        role:          'admin',
        status:        'active',
        slug:          null,
        trialEndDate:  null,
        plan:          'free',
      });
      logger.info(`[AUTH] Compte admin créé : ${adminEmail}`);
    }

    // Charger la tarification depuis la DB (ou l'initialiser si absente)
    const { PricingConfig } = require('./models');
    const { updatePricingCache } = require('./services/priceService');
    let pricingConfig = await PricingConfig.findByPk(1);
    if (!pricingConfig) {
      pricingConfig = await PricingConfig.create({
        id:           1,
        pricePerKm:   parseFloat(process.env.PRICE_PER_KM)  || 2.0,
        minimumPrice: parseFloat(process.env.MINIMUM_PRICE) || 10.0,
        baseFee:      parseFloat(process.env.BASE_FEE)      || 0.0,
        updatedBy:    'system',
      });
      logger.info('[PRICING] Config tarifaire initialisée avec les valeurs par défaut.');
    } else {
      updatePricingCache({
        pricePerKm:   pricingConfig.pricePerKm,
        minimumPrice: pricingConfig.minimumPrice,
        baseFee:      pricingConfig.baseFee,
      });
      logger.info(`[PRICING] Tarification chargée : ${pricingConfig.pricePerKm}€/km, min ${pricingConfig.minimumPrice}€, base ${pricingConfig.baseFee}€`);
    }

    // ── Cron : nettoyage des tokens révoqués expirés (toutes les heures) ────────
    const { RevokedToken } = require('./models');
    const { Op } = require('sequelize');
    setInterval(async () => {
      try {
        const deleted = await RevokedToken.destroy({
          where: { expiresAt: { [Op.lt]: new Date() } },
        });
        if (deleted > 0) logger.info(`[CRON] ${deleted} token(s) révoqués expirés supprimés.`);
      } catch (e) {
        logger.warn('[CRON] Nettoyage revoked_tokens :', e.message);
      }
    }, 60 * 60 * 1000); // toutes les heures

    app.listen(PORT, () => {
      logger.info(`[SERVER] VTC 3M démarré sur le port ${PORT} – mode ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    logger.error(`[SERVER] Impossible de démarrer : ${err.message}`);
    process.exit(1);
  }
}

// ── Gestion propre des signaux d'arrêt ───────────────────────────────────────
process.on('SIGTERM', async () => {
  logger.info('[SERVER] Arrêt propre (SIGTERM)…');
  await sequelize.close();
  process.exit(0);
});
process.on('SIGINT', async () => {
  logger.info('[SERVER] Arrêt propre (SIGINT)…');
  await sequelize.close();
  process.exit(0);
});

start();
