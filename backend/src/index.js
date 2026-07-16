require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const hpp     = require('hpp');
const cookieParser = require('cookie-parser');
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

// ── Confiance envers le reverse proxy (Nginx/Traefik en prod, cf.
//    PLAN_DEPLOIEMENT_PROXMOX_POSTGRES.md) ──────────────────────────────────
// Sans ce réglage, req.ip vaut l'IP du proxy pour toutes les requêtes qui
// passent par lui : le rate limiting par IP (login, réservation, etc.)
// devient inopérant, tous les visiteurs partageant le même compteur.
// Actif uniquement en production par défaut (aucun proxy de confiance en
// dev local) ; ajustable via TRUST_PROXY_HOPS si la topologie réseau change
// (ex. CDN devant le reverse proxy = 2 sauts).
const trustProxyHops = process.env.TRUST_PROXY_HOPS !== undefined
  ? parseInt(process.env.TRUST_PROXY_HOPS, 10)
  : (isProd ? 1 : 0);
app.set('trust proxy', trustProxyHops);

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

// ── Cookies (session JWT httpOnly) ────────────────────────────────────────────
app.use(cookieParser());

// ── Logs HTTP ─────────────────────────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ── Webhook Stripe : body RAW — DOIT être monté AVANT le parser JSON global ───
// Montée directement ici (pas via le routeur billing) : app.use() retire le
// préfixe de montage avant de tester les routes internes, donc un routeur
// monté sur '/api/billing/webhook' ne matche jamais sa propre route interne
// '/webhook' (qui n'existe qu'en le montant sur '/api/billing'). Résultat
// avant ce correctif : la requête retombait sur express.json() puis sur le
// second montage du routeur (ligne ci-dessous), avec un body déjà parsé en
// JSON — stripe.webhooks.constructEvent() exige le Buffer brut et échouait
// systématiquement, donc aucun webhook Stripe n'était jamais traité.
const billingController = require('./controllers/billingController');
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), billingController.handleWebhook);

// ── Body parsing (limité à 10kb) ──────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Sanitisation XSS sur toutes les entrées ───────────────────────────────────
app.use(sanitize);

// ── Forcer Content-Type JSON (ou multipart pour les uploads) sur les routes
//    API POST/PUT ────────────────────────────────────────────────────────────
app.use('/api', (req, res, next) => {
  if (
    ['POST', 'PUT'].includes(req.method) && req.path !== '/'
    && !req.is('application/json') && !req.is('multipart/form-data')
  ) {
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

// ── Photos de cartes de visite (module Contact) : servies en lecture seule.
//    Contrairement aux PDFs, ce sont des assets publics par nature (une
//    carte de visite n'est exposée que si isPublic=true) — noms de fichiers
//    générés côté serveur (UUID), aucune donnée sensible dans ce dossier.
app.use('/uploads/contacts', express.static(path.join(__dirname, '../uploads/contacts')));

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
app.use('/api/contacts',      require('./routes/contacts'));

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

    // Les identifiants par défaut sont documentés publiquement (README) : les
    // laisser actifs en production permettrait une prise de contrôle admin
    // triviale. On refuse de démarrer plutôt que de créer un compte avec un
    // mot de passe connu de tous.
    if (isProd && (adminEmail === 'admin@vtc3m.fr' || adminPass === 'Admin2024!')) {
      throw new Error(
        "ADMIN_LOGIN_EMAIL et ADMIN_PASSWORD doivent être définis dans l'environnement de production " +
        "avec des valeurs différentes des identifiants par défaut (admin@vtc3m.fr / Admin2024!), " +
        "documentés publiquement dans le README."
      );
    }

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

// Ne démarre le serveur (connexion DB, écoute du port…) que si ce fichier est
// exécuté directement (`node src/index.js`) — pas quand il est importé par
// les tests, qui n'ont besoin que de `app` déjà entièrement configurée
// (routes/middlewares) pour tester via supertest sans base de données.
if (require.main === module) {
  start();
}

module.exports = app;
