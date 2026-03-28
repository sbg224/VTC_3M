require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const hpp     = require('hpp');
const rateLimit = require('express-rate-limit');
const path    = require('path');
const { sequelize } = require('./models');
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
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',');
app.use(cors({
  origin: (origin, cb) => {
    // Autoriser les requêtes sans origine (curl, Postman) en dev
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
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



// ── Servir les PDFs générés ───────────────────────────────────────────────────
app.use('/pdfs', express.static(path.join(__dirname, '../pdfs')));

// ── Routes API ────────────────────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/simulate',     require('./routes/simulate'));
app.use('/api/stats',        require('./routes/stats'));

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
    await sequelize.sync({ alter: true });
    logger.info('[DB] Modèles synchronisés.');

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
      await admin.update({ name: adminName, email: adminEmail, password: hashedPass, phone: adminPhone });
      logger.info(`[AUTH] Compte admin mis à jour : ${adminEmail}`);
    } else {
      await Driver.create({ name: adminName, email: adminEmail, password: hashedPass, phone: adminPhone });
      logger.info(`[AUTH] Compte admin créé : ${adminEmail}`);
    }

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
