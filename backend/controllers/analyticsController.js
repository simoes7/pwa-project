const db = require('../db');

exports.getStats = (req, res) => {
  const { serviceId } = req.query;
  const filterClause = serviceId ? ' AND service_id = ? ' : '';
  const params = serviceId ? [serviceId, serviceId, serviceId, serviceId] : [];

  const query = `
    SELECT 
      (SELECT COUNT(*) FROM tickets WHERE DATE(created_at) = CURDATE() ${filterClause}) as total_today,
      (SELECT COUNT(*) FROM services ${serviceId ? 'WHERE id = ?' : ''}) as active_services,
      (SELECT ROUND(IFNULL(AVG(TIMESTAMPDIFF(MINUTE, created_at, NOW())), 0)) FROM tickets WHERE status = 'waiting' ${filterClause}) as avg_wait,
      (SELECT COUNT(*) FROM tickets WHERE status = 'called' ${filterClause}) as currently_serving
  `;

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching stats:', err);
      return res.status(500).json({ error: 'Database error fetching stats' });
    }
    res.json(results[0] || { total_today: 0, active_services: 0, avg_wait: 0, currently_serving: 0 });
  });
};

exports.getAnalytics = (req, res) => {
  const { serviceId, range } = req.query; // range: '24h', '7d', '30d'
  let timeFilter = 'INTERVAL 24 HOUR';
  if (range === '7d') timeFilter = 'INTERVAL 7 DAY';
  if (range === '30d') timeFilter = 'INTERVAL 30 DAY';

  let serviceFilter = '';
  const params = [];
  if (serviceId) {
    serviceFilter = ' AND service_id = ? ';
    params.push(serviceId);
  }

  // Hourly throughput for the chart
  const hourlyQuery = `
    SELECT HOUR(created_at) as hour, COUNT(*) as count 
    FROM tickets 
    WHERE created_at >= NOW() - ${timeFilter} ${serviceFilter}
    GROUP BY HOUR(created_at)
    ORDER BY hour ASC
  `;

  // General metrics
  const metricsQuery = `
    SELECT 
      COUNT(*) as total_throughput,
      ROUND(IFNULL(AVG(TIMESTAMPDIFF(MINUTE, created_at, finished_at)), 0)) as avg_duration,
      (SELECT COUNT(*) FROM tickets WHERE status = 'waiting' ${serviceFilter}) as current_waiting,
      (SELECT COUNT(*) FROM feedback f JOIN tickets t ON f.ticket_id = t.id WHERE t.created_at >= NOW() - ${timeFilter} ${serviceFilter.replace('service_id', 't.service_id')}) as total_feedback,
      (SELECT ROUND(AVG(rating), 1) FROM feedback f JOIN tickets t ON f.ticket_id = t.id WHERE t.created_at >= NOW() - ${timeFilter} ${serviceFilter.replace('service_id', 't.service_id')}) as avg_rating
    FROM tickets 
    WHERE status = 'done' AND created_at >= NOW() - ${timeFilter} ${serviceFilter}
  `;

  db.query(hourlyQuery, params, (err, hourlyResults) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query(metricsQuery, params, (err, metricsResults) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        hourly: hourlyResults,
        metrics: metricsResults[0]
      });
    });
  });
};
