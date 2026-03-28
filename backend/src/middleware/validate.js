/**
 * Règles de validation des entrées avec express-validator
 * Appliquées côté serveur indépendamment du frontend
 */
const { body, param, validationResult } = require('express-validator');

// Patterns SQL suspects à rejeter (défense en profondeur — l'ORM protège déjà)
const SQL_PATTERN = /(\bOR\b|\bAND\b|\bUNION\b|\bSELECT\b|\bINSERT\b|\bDROP\b|\bDELETE\b|\bUPDATE\b|--|;|\/\*|\*\/)/i;

// Retourne le premier message d'erreur de validation
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: errors.array()[0].msg,
    });
  }
  next();
};

// ── Règles réservation ────────────────────────────────────────────────────────
const reservationRules = [
  body('firstName')
    .trim().notEmpty().withMessage('Le prénom est requis.')
    .isLength({ min: 2, max: 100 }).withMessage('Prénom invalide (2-100 caractères).')
    .matches(/^[a-zA-ZÀ-ÿ\s\-']+$/).withMessage('Prénom : caractères invalides.'),

  body('lastName')
    .trim().notEmpty().withMessage('Le nom est requis.')
    .isLength({ min: 2, max: 100 }).withMessage('Nom invalide (2-100 caractères).')
    .matches(/^[a-zA-ZÀ-ÿ\s\-']+$/).withMessage('Nom : caractères invalides.'),

  body('email')
    .trim().notEmpty().withMessage('L\'email est requis.')
    .isEmail().withMessage('Adresse email invalide.')
    .normalizeEmail()
    .isLength({ max: 254 }).withMessage('Email trop long.'),

  body('phone')
    .trim().notEmpty().withMessage('Le téléphone est requis.')
    .matches(/^(\+33|0033|0)[1-9](\d{8})$/).withMessage('Numéro de téléphone invalide (format français requis).'),

  body('departureAddress')
    .trim().notEmpty().withMessage('L\'adresse de départ est requise.')
    .isLength({ min: 3, max: 500 }).withMessage('Adresse de départ invalide.')
    .not().matches(SQL_PATTERN).withMessage('Adresse de départ : contenu invalide.'),

  body('arrivalAddress')
    .trim().notEmpty().withMessage('L\'adresse d\'arrivée est requise.')
    .isLength({ min: 3, max: 500 }).withMessage('Adresse d\'arrivée invalide.')
    .not().matches(SQL_PATTERN).withMessage('Adresse d\'arrivée : contenu invalide.'),

  body('date')
    .notEmpty().withMessage('La date est requise.')
    .isDate({ format: 'YYYY-MM-DD' }).withMessage('Format de date invalide.')
    .custom((value) => {
      const d = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (d < today) throw new Error('La date doit être dans le futur.');
      return true;
    }),

  body('time')
    .notEmpty().withMessage('L\'heure est requise.')
    .matches(/^([01]?\d|2[0-3]):[0-5]\d$/).withMessage('Format d\'heure invalide (HH:MM).'),

  body('passengers')
    .optional()
    .isInt({ min: 1, max: 7 }).withMessage('Nombre de passagers invalide (1-7).'),

  body('luggage')
    .optional()
    .isInt({ min: 0, max: 10 }).withMessage('Nombre de bagages invalide (0-10).'),

  body('comments')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Commentaire trop long (max 1000 caractères).'),

  body('distance')
    .optional()
    .isFloat({ min: 0, max: 99999 }).withMessage('Distance invalide.'),

  body('estimatedPrice')
    .optional()
    .isFloat({ min: 0, max: 99999 }).withMessage('Prix estimé invalide.'),

  body('gdprConsent')
    .notEmpty().withMessage('Le consentement RGPD est requis.')
    .custom((value) => {
      if (value !== true && value !== 'true') {
        throw new Error('Vous devez accepter la politique de confidentialité.');
      }
      return true;
    }),
];

// ── Règles complétion course ──────────────────────────────────────────────────
const completeRules = [
  body('price')
    .notEmpty().withMessage('Le prix est requis.')
    .isFloat({ min: 1, max: 9999 }).withMessage('Prix invalide (entre 1 et 9999 €).'),
];

// ── Règles login ──────────────────────────────────────────────────────────────
const loginRules = [
  body('email')
    .trim().notEmpty().withMessage('Email requis.')
    .isEmail().withMessage('Email invalide.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Mot de passe requis.')
    .isLength({ min: 6, max: 128 }).withMessage('Mot de passe invalide.'),
];

// ── Validation UUID ───────────────────────────────────────────────────────────
const uuidRule = [
  param('id')
    .isUUID().withMessage('Identifiant de réservation invalide.'),
];

module.exports = { validate, reservationRules, completeRules, loginRules, uuidRule };
