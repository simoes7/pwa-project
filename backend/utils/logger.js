const db = require('../db');

const logSystemAction = (actionType, serviceId, ticketId, userId, metadata = null) => {
  const metaStr = metadata ? JSON.stringify(metadata) : null;
  const q = 'INSERT INTO audit_logs (action_type, service_id, ticket_id, user_id, metadata) VALUES (?, ?, ?, ?, ?)';
  db.query(q, [actionType, serviceId || null, ticketId || null, userId || null, metaStr], (err) => {
    if (err) console.error('Failed to log system action:', err);
  });
};

module.exports = { logSystemAction };
