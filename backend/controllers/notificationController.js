const db = require('../db');

exports.getUserNotifications = (req, res) => {
  const userId = req.params.userId;
  const query = 'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50';
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching notifications:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
};

exports.markAsRead = (req, res) => {
  const { id } = req.params;
  const query = 'UPDATE notifications SET is_read = 1 WHERE id = ?';
  
  db.query(query, [id], (err) => {
    if (err) {
      console.error('Error marking notification as read:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
};

exports.markAllAsRead = (req, res) => {
  const { userId } = req.body;
  const query = 'UPDATE notifications SET is_read = 1 WHERE user_id = ?';
  
  db.query(query, [userId], (err) => {
    if (err) {
      console.error('Error marking all notifications as read:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
};
