const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/stats', analyticsController.getStats);
router.get('/analytics', analyticsController.getAnalytics);

module.exports = router;
