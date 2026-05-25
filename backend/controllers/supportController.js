const db = require('../db');

// Run migrations to ensure custom columns exist
db.query(`SHOW COLUMNS FROM support_requests LIKE 'admin_reply'`, (err, rows) => {
  if (!err && rows.length === 0) {
    db.query(`ALTER TABLE support_requests ADD COLUMN admin_reply TEXT DEFAULT NULL`, (err) => {
      if (err) console.error("Error adding admin_reply column:", err);
      else console.log("Added admin_reply column to support_requests");
    });
  }
});

db.query(`SHOW COLUMNS FROM support_requests LIKE 'reply_at'`, (err, rows) => {
  if (!err && rows.length === 0) {
    db.query(`ALTER TABLE support_requests ADD COLUMN reply_at TIMESTAMP NULL DEFAULT NULL`, (err) => {
      if (err) console.error("Error adding reply_at column:", err);
      else console.log("Added reply_at column to support_requests");
    });
  }
});

db.query(`SHOW COLUMNS FROM support_requests LIKE 'category'`, (err, rows) => {
  if (!err && rows.length === 0) {
    db.query(`ALTER TABLE support_requests ADD COLUMN category VARCHAR(100) DEFAULT 'General'`, (err) => {
      if (err) console.error("Error adding category column:", err);
      else console.log("Added category column to support_requests");
    });
  }
});

// Create support request
exports.createSupportMessage = (req, res) => {
  const { userId, serviceId, subject, message, category } = req.body;
  const cat = category || 'General';
  const query = 'INSERT INTO support_requests (user_id, service_id, subject, message, category) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [userId || null, serviceId || null, subject, message, cat], (err, result) => {
    if (err) {
      console.error('Error creating support request:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Support request sent', id: result.insertId });
  });
};

// Legacy compatibility
exports.createSupportRequest = (req, res) => {
  const { userId, subject, message } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message are required' });
  }

  const query = `INSERT INTO support_requests (user_id, subject, message, category) VALUES (?, ?, ?, 'General')`;
  db.query(query, [userId || null, subject, message], (err, result) => {
    if (err) {
      console.error('Error creating support request:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true, requestId: result.insertId, message: 'Request submitted successfully' });
  });
};

// Get support requests (admin filter or general)
exports.getSupportRequests = (req, res) => {
  const { serviceId } = req.query;
  let query = `
    SELECT sr.*, u.name as user_name, u.email as user_email 
    FROM support_requests sr
    LEFT JOIN users u ON sr.user_id = u.id
  `;
  const params = [];
  
  if (serviceId) {
    query += ` WHERE sr.service_id = ? `;
    params.push(serviceId);
  }
  
  query += ` ORDER BY sr.created_at DESC`;
  
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching support requests:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
};

// Get support requests for a specific user
exports.getUserSupportRequests = (req, res) => {
  const { userId } = req.params;
  const query = `SELECT * FROM support_requests WHERE user_id = ? ORDER BY created_at DESC`;
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user support requests:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
};

// Reply to support request
exports.replySupportRequest = (req, res) => {
  const { id } = req.params;
  const { reply } = req.body;
  if (!reply) {
    return res.status(400).json({ error: 'Reply content is required' });
  }
  
  const query = `
    UPDATE support_requests 
    SET admin_reply = ?, reply_at = CURRENT_TIMESTAMP, status = 'replied' 
    WHERE id = ?
  `;
  db.query(query, [reply, id], (err, result) => {
    if (err) {
      console.error('Error replying to support request:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, message: 'Reply sent successfully' });
  });
};

// Resolve support request
exports.resolveSupportRequest = (req, res) => {
  const { id } = req.params;
  const query = `UPDATE support_requests SET status = 'resolved' WHERE id = ?`;
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error resolving support request:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, message: 'Request marked as resolved' });
  });
};
