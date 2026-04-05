const express          = require('express');
const router           = express.Router();
const crmCtrl          = require('../controllers/crmController');
const auth             = require('../middleware/auth');
const checkSubscription = require('../middleware/checkSubscription');

// Toutes les routes CRM sont protégées : JWT + abonnement valide
router.use(auth, checkSubscription);

// GET /api/crm/clients          — liste paginée avec recherche
router.get('/clients', crmCtrl.getClients);

// GET /api/crm/clients/export   — téléchargement CSV
router.get('/clients/export', crmCtrl.exportCsv);

module.exports = router;
