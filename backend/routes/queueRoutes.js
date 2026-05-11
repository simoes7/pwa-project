const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');

router.get('-live', queueController.getQueueLive);

module.exports = router;
