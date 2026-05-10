const db = require('../db');

exports.getQueueLive = (req, res) => {
  const query = `
    SELECT t.id, t.status, t.service_id, t.created_at,
           s.name as service_name
    FROM tickets t
    JOIN services s ON t.service_id = s.id
    WHERE t.status IN ('waiting', 'called')
    ORDER BY t.created_at ASC
    LIMIT 50
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching live queue:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
};
