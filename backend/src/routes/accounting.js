const express       = require('express');
const router        = express.Router();
const { body, query } = require('express-validator');
const accountingCtrl = require('../controllers/accountingController');
const auth          = require('../middleware/auth');
const requireAdmin  = require('../middleware/requireAdmin');
const { handleValidation } = require('../middleware/validate');

// Toutes les routes comptabilité sont admin-only
router.use(auth, requireAdmin);

// GET /api/admin/accounting/summary?period=month&startDate=&endDate=
router.get(
  '/summary',
  [
    query('period').optional().isIn(['week', 'month', 'prev_month', 'custom']).withMessage('Période invalide.'),
    query('startDate').optional().isDate().withMessage('startDate invalide.'),
    query('endDate').optional().isDate().withMessage('endDate invalide.'),
  ],
  handleValidation,
  accountingCtrl.getAccountingSummary,
);

// GET /api/admin/accounting/:driverId/statement?period=...
router.get(
  '/:driverId/statement',
  [
    query('period').optional().isIn(['week', 'month', 'prev_month', 'custom']),
    query('startDate').optional().isDate(),
    query('endDate').optional().isDate(),
  ],
  handleValidation,
  accountingCtrl.getDriverStatement,
);

// GET /api/admin/accounting/:driverId/pdf?period=...
router.get('/:driverId/pdf', accountingCtrl.generateStatementPdf);

// PUT /api/admin/accounting/:driverId/commission
router.put(
  '/:driverId/commission',
  [
    body('commissionRate')
      .isFloat({ min: 0, max: 100 })
      .withMessage('commissionRate doit être entre 0 et 100.'),
  ],
  handleValidation,
  accountingCtrl.updateDriverCommission,
);

module.exports = router;
