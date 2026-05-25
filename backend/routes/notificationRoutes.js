const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.get('/user/:userId', notificationController.getUserNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.post('/read-all', notificationController.markAllAsRead);

module.exports = router;
