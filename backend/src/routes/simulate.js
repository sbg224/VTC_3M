const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const ctrl = require('../controllers/simulateController');
const { validate } = require('../middleware/validate');

const simulateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1h
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite atteinte. Maximum 30 simulations par heure par IP.' },
});

const simulateRules = [
  body('departureAddress')
    .trim().notEmpty().withMessage('L\'adresse de départ est requise.')
    .isLength({ min: 3, max: 500 }).withMessage('Adresse de départ invalide (3-500 caractères).'),
  body('arrivalAddress')
    .trim().notEmpty().withMessage('L\'adresse d\'arrivée est requise.')
    .isLength({ min: 3, max: 500 }).withMessage('Adresse d\'arrivée invalide (3-500 caractères).'),
];

router.post('/', simulateLimiter, simulateRules, validate, ctrl.simulate);

module.exports = router;
