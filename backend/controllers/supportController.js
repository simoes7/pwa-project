const db = require('../db');

exports.createSupportRequest = (req, res) => {
  const { userId, subject, message } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message are required' });
  }

  const query = `INSERT INTO support_requests (user_id, subject, message) VALUES (?, ?, ?)`;
  db.query(query, [userId || null, subject, message], (err, result) => {
    if (err) {
      console.error('Error creating support request:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true, requestId: result.insertId, message: 'Request submitted successfully' });
  });
};

exports.createSupportMessage = (req, res) => {
  const { userId, serviceId, subject, message } = req.body;
  const query = 'INSERT INTO support_requests (user_id, service_id, subject, message) VALUES (?, ?, ?, ?)';
  db.query(query, [userId || null, serviceId || null, subject, message], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Support request sent', id: result.insertId });
  });
};
