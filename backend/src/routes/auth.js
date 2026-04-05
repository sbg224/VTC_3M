const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { validate, loginRules, registerRules } = require('../middleware/validate');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
});

// Rate limit plus strict sur l'inscription (anti-spam)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1h
  max: 5,
  message: { error: 'Trop de tentatives d\'inscription. Réessayez dans 1 heure.' },
});

router.post('/register',         registerLimiter, registerRules, validate, authController.register);
router.post('/login',            loginLimiter, loginRules, validate, authController.login);
router.get('/me',                authMiddleware, authController.me);
router.put('/change-password',   authMiddleware, authController.changePassword);

module.exports = router;
