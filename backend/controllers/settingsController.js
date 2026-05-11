const db = require('../db');

exports.getSettings = (req, res) => {
  const { serviceId } = req.query;
  const query = 'SELECT * FROM settings' + (serviceId ? ' WHERE service_id = ?' : '');
  db.query(query, serviceId ? [serviceId] : [], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.updateSetting = (req, res) => {
  const { serviceId, key, value } = req.body;
  const query = 'INSERT INTO settings (service_id, setting_key, setting_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?';
  db.query(query, [serviceId, key, value, value], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Setting updated' });
  });
};
