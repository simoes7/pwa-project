const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/accounts', authenticateToken, requireRole(['super_admin']), adminController.getAdminAccounts);
router.post('/accounts', authenticateToken, requireRole(['super_admin']), adminController.createAdminAccount);
router.put('/accounts/:id', authenticateToken, requireRole(['super_admin']), adminController.updateAdminAccount);
router.delete('/accounts/:id', authenticateToken, requireRole(['super_admin']), adminController.deleteAdminAccount);

router.get('/analytics', authenticateToken, requireRole(['super_admin']), adminController.getSystemAnalytics);
router.get('/analytics/v2', authenticateToken, requireRole(['super_admin', 'admin']), adminController.getSystemAnalyticsV2);
router.get('/tickets/history', authenticateToken, requireRole(['super_admin', 'admin']), adminController.getTicketHistory);
router.get('/audit-logs', authenticateToken, requireRole(['super_admin', 'admin']), adminController.getAuditLogs);

module.exports = router;
