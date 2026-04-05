const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const auth  = require('../middleware/auth');
const checkSubscription = require('../middleware/checkSubscription');

router.get('/', auth, checkSubscription, statsController.getStats);

module.exports = router;
