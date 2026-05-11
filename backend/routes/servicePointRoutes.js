const express = require('express');
const router = express.Router();
const servicePointController = require('../controllers/servicePointController');

router.get('/', servicePointController.getServicePoints);

module.exports = router;
