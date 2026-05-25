const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { authenticateToken, requireRole, requireServiceAdmin } = require('../middleware/auth');

router.get('/', serviceController.getServices);
router.post('/', authenticateToken, requireRole(['super_admin']), serviceController.createService);
router.put('/:id/info', authenticateToken, requireServiceAdmin, serviceController.updateServiceInfo);
router.put('/:id/operations', authenticateToken, requireServiceAdmin, serviceController.updateServiceOperations);
router.get('/:id/schedules', serviceController.getServiceSchedules);
router.put('/:id/schedules', authenticateToken, requireServiceAdmin, serviceController.updateServiceSchedules);
router.delete('/:id', authenticateToken, requireRole(['super_admin']), serviceController.deleteService);

module.exports = router;
