const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');

// Create support request
router.post('/', supportController.createSupportMessage);

// Get support requests (admin view with service filtering)
router.get('/', supportController.getSupportRequests);

// Get support requests for a specific user
router.get('/user/:userId', supportController.getUserSupportRequests);

// Reply to a support request
router.put('/:id/reply', supportController.replySupportRequest);

// Resolve a support request
router.put('/:id/resolve', supportController.resolveSupportRequest);

module.exports = router;
