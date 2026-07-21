/**
 * Règles de validation des entrées avec express-validator
 * Appliquées côté serveur indépendamment du frontend
 */
const { body, param, validationResult } = require('express-validator');
const { FRENCH_PHONE_PATTERN, normalizeFrenchPhone } = require('../utils/phone');

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
    .customSanitizer(normalizeFrenchPhone)
    .matches(FRENCH_PHONE_PATTERN).withMessage('Numéro de téléphone invalide (format français requis).'),

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
    .toLowerCase(),

  body('password')
    .notEmpty().withMessage('Mot de passe requis.')
    .isLength({ min: 6, max: 128 }).withMessage('Mot de passe invalide.'),
];

// ── Règles inscription chauffeur ──────────────────────────────────────────────
const registerRules = [
  body('name')
    .trim().notEmpty().withMessage('Le nom est requis.')
    .isLength({ min: 2, max: 100 }).withMessage('Nom invalide (2-100 caractères).')
    .matches(/^[a-zA-ZÀ-ÿ\s\-']+$/).withMessage('Nom : caractères invalides.'),

  body('email')
    .trim().notEmpty().withMessage('Email requis.')
    .isEmail().withMessage('Adresse email invalide.')
    .toLowerCase()
    .isLength({ max: 254 }).withMessage('Email trop long.'),

  body('password')
    .notEmpty().withMessage('Mot de passe requis.')
    .isLength({ min: 8, max: 128 }).withMessage('Le mot de passe doit faire au moins 8 caractères.')
    .matches(/[A-Z]/).withMessage('Le mot de passe doit contenir au moins une majuscule.')
    .matches(/[0-9]/).withMessage('Le mot de passe doit contenir au moins un chiffre.'),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .customSanitizer(normalizeFrenchPhone)
    .matches(FRENCH_PHONE_PATTERN).withMessage('Numéro de téléphone invalide (format français requis).'),
];

// ── Validation UUID ───────────────────────────────────────────────────────────
const uuidRule = [
  param('id')
    .isUUID().withMessage('Identifiant de réservation invalide.'),
];

// ── Règles module Contact (carte de visite) ───────────────────────────────────
const contactSlugParamRule = [
  param('slug')
    .trim().notEmpty().withMessage('Slug requis.')
    .isLength({ max: 80 }).withMessage('Slug invalide.')
    .matches(/^[a-z0-9-]+$/).withMessage('Slug invalide.'),
];

// Champs communs à la création et à l'édition (l'édition peut être partielle,
// ex. un simple toggle isPublic depuis la liste admin — firstName/lastName ne
// sont donc requis qu'à la création).
const contactOptionalFieldRules = [
  body('company')
    .optional({ checkFalsy: true }).trim().isLength({ max: 150 }).withMessage('Société invalide.'),

  body('jobTitle')
    .optional({ checkFalsy: true }).trim().isLength({ max: 150 }).withMessage('Fonction invalide.'),

  body('shortDescription')
    .optional({ checkFalsy: true }).trim().isLength({ max: 500 }).withMessage('Description trop longue (max 500 caractères).'),

  body('phone')
    .optional({ checkFalsy: true }).trim()
    .customSanitizer(normalizeFrenchPhone)
    .matches(FRENCH_PHONE_PATTERN).withMessage('Numéro de téléphone invalide (format français requis).'),

  body('email')
    .optional({ checkFalsy: true }).trim().isEmail().withMessage('Adresse email invalide.').normalizeEmail(),

  body('website')
    .optional({ checkFalsy: true }).trim().isURL().withMessage('Site web invalide.'),

  body('address')
    .optional({ checkFalsy: true }).trim().isLength({ max: 300 }).withMessage('Adresse invalide.')
    .not().matches(SQL_PATTERN).withMessage('Adresse : contenu invalide.'),

  body('bookingUrl')
    .optional({ checkFalsy: true }).trim().isLength({ max: 300 }).withMessage('URL de réservation invalide.'),

  body('driverId')
    .optional({ checkFalsy: true }).isUUID().withMessage('Identifiant chauffeur invalide.'),

  body('isPublic')
    .optional().isBoolean().withMessage('isPublic doit être un booléen.'),
];

const contactCreateRules = [
  body('firstName')
    .trim().notEmpty().withMessage('Le prénom est requis.')
    .isLength({ min: 1, max: 100 }).withMessage('Prénom invalide (max 100 caractères).'),

  body('lastName')
    .trim().notEmpty().withMessage('Le nom est requis.')
    .isLength({ min: 1, max: 100 }).withMessage('Nom invalide (max 100 caractères).'),

  ...contactOptionalFieldRules,
];

const contactUpdateRules = [
  body('firstName')
    .optional({ checkFalsy: true }).trim().isLength({ min: 1, max: 100 }).withMessage('Prénom invalide (max 100 caractères).'),

  body('lastName')
    .optional({ checkFalsy: true }).trim().isLength({ min: 1, max: 100 }).withMessage('Nom invalide (max 100 caractères).'),

  ...contactOptionalFieldRules,
];

const contactEventRules = [
  body('type')
    .trim().notEmpty().withMessage('Type d\'événement requis.')
    .isIn(['click_phone', 'click_whatsapp', 'click_booking', 'click_email'])
    .withMessage('Type d\'événement invalide.'),
];

// Alias pour la compatibilité avec les routes qui importent handleValidation
const handleValidation = validate;

module.exports = {
  validate, handleValidation, reservationRules, completeRules, loginRules, registerRules, uuidRule,
  contactSlugParamRule, contactCreateRules, contactUpdateRules, contactEventRules,
};
