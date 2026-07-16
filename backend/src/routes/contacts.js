const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/contactController');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const uploadContactPhoto = require('../middleware/uploadContactPhoto');
const {
  validate, uuidRule, contactSlugParamRule, contactCreateRules, contactUpdateRules, contactEventRules,
} = require('../middleware/validate');

// Rate limiter dédié au tracking public — évite le bourrage de la table
// ContactEvent (le rate-limit global /api existe déjà mais reste large).
const eventLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes. Réessayez plus tard.' },
});

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/public/:slug', contactSlugParamRule, validate, ctrl.getPublicProfile);
router.get('/vcard/:slug',  contactSlugParamRule, validate, ctrl.downloadVcard);
router.post('/events/:slug', eventLimiter, [...contactSlugParamRule, ...contactEventRules], validate, ctrl.trackEvent);

// ── Admin (JWT + rôle admin) ───────────────────────────────────────────────────
router.get('/',     auth, requireAdmin, ctrl.listContacts);
router.post('/',    auth, requireAdmin, contactCreateRules, validate, ctrl.createContact);
router.get('/:id',  auth, requireAdmin, uuidRule, validate, ctrl.getContact);
router.put('/:id',  auth, requireAdmin, [...uuidRule, ...contactUpdateRules], validate, ctrl.updateContact);
router.delete('/:id', auth, requireAdmin, uuidRule, validate, ctrl.deleteContact);

router.post('/:id/photo', auth, requireAdmin, uuidRule, validate, (req, res, next) => {
  uploadContactPhoto(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, ctrl.uploadPhoto);

module.exports = router;
