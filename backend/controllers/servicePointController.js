const db = require('../db');

exports.getServicePoints = (req, res) => {
  const { serviceId } = req.query;
  const query = 'SELECT * FROM service_points' + (serviceId ? ' WHERE service_id = ?' : '');
  db.query(query, serviceId ? [serviceId] : [], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};
