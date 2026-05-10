const db = require('../db');

exports.getFaqs = (req, res) => {
  db.query('SELECT * FROM faqs WHERE is_active = 1', (err, results) => {
    if (err) {
      console.error('Error fetching FAQs:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
};
