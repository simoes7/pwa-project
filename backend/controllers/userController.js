const db = require('../db');

exports.getUsers = (req, res) => {
  // Query the database to get all users
  const query = 'SELECT id, name, email, phone_number, role, is_active, created_at FROM users WHERE role = "user"';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: 'Failed to fetch users from the database' });
    }
    res.json(results);
  });
};

exports.updateUserRole = (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['admin', 'super_admin', 'staff', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role specified' });
  }

  db.query('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [role, id], (err, result) => {
    if (err) {
      console.error('Error updating user role:', err);
      return res.status(500).json({ error: 'Failed to update user role' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User role updated successfully', role });
  });
};
