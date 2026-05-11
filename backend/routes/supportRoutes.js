const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');

router.post('-requests', supportController.createSupportRequest);
router.post('/', supportController.createSupportMessage);

module.exports = router;
