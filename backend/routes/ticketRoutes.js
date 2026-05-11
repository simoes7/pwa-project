const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.post('/', ticketController.createTicket);
router.get('/user/:userId', ticketController.getUserTickets);
router.get('/position/:id', ticketController.getTicketPosition);
router.get('/:id/eta', ticketController.getTicketETA);
router.patch('/:id', authenticateToken, requireRole(['super_admin', 'admin']), ticketController.updateTicketStatus);
router.patch('/:id/self', ticketController.updateTicketStatusSelf);
router.get('/', authenticateToken, requireRole(['super_admin', 'admin']), ticketController.getAllTicketsAdmin);
router.post('/call-next', authenticateToken, requireRole(['admin', 'staff', 'super_admin']), ticketController.callNextTicket);
router.post('/:id/transfer', authenticateToken, requireRole(['admin', 'staff', 'super_admin']), ticketController.transferTicket);

module.exports = router;
