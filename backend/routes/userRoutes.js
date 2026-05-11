const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', authenticateToken, requireRole(['super_admin', 'admin']), userController.getUsers);
router.put('/:id/role', authenticateToken, requireRole(['super_admin']), userController.updateUserRole);

module.exports = router;
