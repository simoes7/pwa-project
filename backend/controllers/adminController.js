const db = require('../db');
const bcrypt = require('bcrypt');

exports.getAdminAccounts = (req, res) => {
  const query = `
    SELECT 
      u.id, u.name, u.email, u.phone_number, u.role, u.is_active, u.created_at,
      (SELECT sa.service_id FROM staff_assignments sa WHERE sa.user_id = u.id LIMIT 1) as service_id,
      (SELECT s.name FROM staff_assignments sa JOIN services s ON sa.service_id = s.id WHERE sa.user_id = u.id LIMIT 1) as service_name
    FROM users u
    WHERE u.role IN ('admin', 'super_admin', 'staff')
    ORDER BY u.created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching admin accounts:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json(results);
  });
};

exports.createAdminAccount = async (req, res) => {
  const { name, email, password, phone_number, role, is_active, service_id } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  if (!['admin', 'super_admin', 'staff'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role specified' });
  }

  try {
    // Check if user already exists
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.length > 0) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert the new admin user
      const query = 'INSERT INTO users (name, email, password, phone_number, role, is_active) VALUES (?, ?, ?, ?, ?, ?)';
      db.query(query, [name, email, hashedPassword, phone_number || null, role, is_active !== false], (err, result) => {
        if (err) {
          console.error('Error creating admin account:', err);
          return res.status(500).json({ error: 'Failed to create admin account' });
        }

        const adminId = result.insertId;

        // Assign service if provided
        if (service_id) {
          db.query('INSERT IGNORE INTO staff_assignments (user_id, service_id) VALUES (?, ?)', [adminId, service_id], (saErr) => {
            if (saErr) console.error('Failed to create staff assignment:', saErr);
          });
        }

        res.status(201).json({
          message: 'Admin account created successfully',
          admin: {
            id: adminId,
            name,
            email,
            phone_number: phone_number || null,
            role,
            is_active: is_active !== false,
            service_id: service_id || null
          }
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during admin account creation' });
  }
};

exports.updateAdminAccount = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, phone_number, role, is_active, service_id } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  if (role && !['admin', 'super_admin', 'staff'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role specified' });
  }

  try {
    // Check if admin exists
    db.query('SELECT * FROM users WHERE id = ? AND role IN ("admin", "super_admin", "staff")', [id], async (err, results) => {
      if (err) {
        console.error('Error checking admin account:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Admin account not found' });
      }

      const existingAdmin = results[0];

      // Check if email is being changed and if new email already exists
      if (email !== existingAdmin.email) {
        db.query('SELECT * FROM users WHERE email = ? AND id != ?', [email, id], (emailErr, emailResults) => {
          if (emailErr) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (emailResults.length > 0) {
            return res.status(400).json({ error: 'User with this email already exists' });
          }

          // Continue with update
          performUpdate();
        });
      } else {
        performUpdate();
      }

      function performUpdate() {
        // Build update query dynamically based on provided fields
        const updateFields = [];
        const updateValues = [];

        if (name !== existingAdmin.name) {
          updateFields.push('name = ?');
          updateValues.push(name);
        }

        if (email !== existingAdmin.email) {
          updateFields.push('email = ?');
          updateValues.push(email);
        }

        if (password) {
          updateFields.push('password = ?');
          updateValues.push(bcrypt.hashSync(password, 10));
        }

        if (phone_number !== existingAdmin.phone_number) {
          updateFields.push('phone_number = ?');
          updateValues.push(phone_number || null);
        }

        if (role && role !== existingAdmin.role) {
          updateFields.push('role = ?');
          updateValues.push(role);
        }

        if (is_active !== existingAdmin.is_active) {
          updateFields.push('is_active = ?');
          updateValues.push(is_active !== false);
        }

        if (updateFields.length > 0) {
          updateFields.push('updated_at = CURRENT_TIMESTAMP');
          updateValues.push(id);

          const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

          db.query(updateQuery, updateValues, (updateErr, updateResult) => {
            if (updateErr) {
              console.error('Error updating admin account:', updateErr);
              return res.status(500).json({ error: 'Failed to update admin account' });
            }
            updateServiceAssignment();
          });
        } else {
          updateServiceAssignment();
        }

        function updateServiceAssignment() {
          if (service_id !== undefined) {
            if (service_id === null || service_id === '') {
              db.query('DELETE FROM staff_assignments WHERE user_id = ?', [id], () => finishUpdate());
            } else {
              // First delete existing assignment, then insert new one to be safe
              db.query('DELETE FROM staff_assignments WHERE user_id = ?', [id], () => {
                db.query('INSERT IGNORE INTO staff_assignments (user_id, service_id) VALUES (?, ?)', [id, service_id], () => finishUpdate());
              });
            }
          } else {
            finishUpdate();
          }
        }

        function finishUpdate() {
          res.json({
            message: 'Admin account updated successfully',
            admin: {
              id: parseInt(id),
              name,
              email,
              phone_number: phone_number || null,
              role: role || existingAdmin.role,
              is_active: is_active !== false,
              service_id: service_id !== undefined ? service_id : null
            }
          });
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during admin account update' });
  }
};

exports.deleteAdminAccount = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if admin exists and prevent deletion of super admin
    db.query('SELECT * FROM users WHERE id = ? AND role IN ("admin", "super_admin", "staff")', [id], (err, results) => {
      if (err) {
        console.error('Error checking admin account:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Admin account not found' });
      }

      const admin = results[0];

      if (admin.role === 'super_admin' && admin.email === 'superadmin@example.com') {
        return res.status(400).json({ error: 'Cannot delete the primary super admin account' });
      }

      // First delete any staff assignments
      db.query('DELETE FROM staff_assignments WHERE user_id = ?', [id], (saErr) => {
        if (saErr) {
          console.error('Error deleting staff assignments:', saErr);
          return res.status(500).json({ error: 'Database error cleaning up assignments' });
        }

        // Delete the admin account
        db.query('DELETE FROM users WHERE id = ?', [id], (deleteErr, deleteResult) => {
          if (deleteErr) {
            console.error('Error deleting admin account:', deleteErr);
            return res.status(500).json({ error: 'Failed to delete admin account' });
          }

          if (deleteResult.affectedRows === 0) {
            return res.status(404).json({ error: 'Admin account not found' });
          }

          res.json({ message: 'Admin account deleted successfully' });
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during admin account deletion' });
  }
};

exports.getSystemAnalytics = async (req, res) => {
  try {
    const stats = {};

    // 1. Overview counts
    const overviewQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM services) as total_services,
        (SELECT COUNT(*) FROM users WHERE role IN ('admin', 'super_admin')) as total_admins,
        (SELECT COUNT(*) FROM tickets WHERE DATE(created_at) = CURDATE()) as tickets_today
    `;

    db.query(overviewQuery, (err, overview) => {
      if (err) return res.status(500).json({ error: 'Database error on overview' });
      stats.overview = overview[0];

      // 2. Tickets by status
      db.query('SELECT status, COUNT(*) as count FROM tickets GROUP BY status', (err, statusStats) => {
        if (err) return res.status(500).json({ error: 'Database error on status' });
        stats.ticketsByStatus = statusStats;

        // 3. Tickets by service (Top 5)
        const serviceQuery = `
          SELECT s.name, COUNT(t.id) as count 
          FROM tickets t 
          JOIN services s ON t.service_id = s.id 
          GROUP BY t.service_id 
          ORDER BY count DESC 
          LIMIT 5
        `;
        db.query(serviceQuery, (err, serviceStats) => {
          if (err) return res.status(500).json({ error: 'Database error on services' });
          stats.ticketsByService = serviceStats;

          // 4. Last 7 days trend
          const trendQuery = `
            SELECT DATE(created_at) as date, COUNT(*) as count 
            FROM tickets 
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
            GROUP BY DATE(created_at) 
            ORDER BY date ASC
          `;
          db.query(trendQuery, (err, trendStats) => {
            if (err) return res.status(500).json({ error: 'Database error on trend' });
            stats.last7DaysTrend = trendStats;

            res.json(stats);
          });
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during analytics generation' });
  }
};

exports.getSystemAnalyticsV2 = (req, res) => {
  const { serviceId, startDate, endDate } = req.query;

  let dateFilter = '1=1';
  const params = [];

  if (startDate && endDate) {
    dateFilter = 't.created_at BETWEEN ? AND ?';
    params.push(startDate, endDate);
  } else if (startDate) {
    dateFilter = 't.created_at >= ?';
    params.push(startDate);
  } else if (endDate) {
    dateFilter = 't.created_at <= ?';
    params.push(endDate);
  }

  let serviceFilter = '';
  if (serviceId) {
    serviceFilter = ' AND t.service_id = ? ';
    params.push(serviceId);
  }

  const fullFilter = `${dateFilter}${serviceFilter}`;
  const results = {};

  // 1. KPI Metrics
  const kpiQuery = `
    SELECT 
      COUNT(*) as total_tickets,
      SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as tickets_served,
      SUM(CASE WHEN t.status = 'cancelled' THEN 1 ELSE 0 END) as tickets_cancelled,
      SUM(CASE WHEN t.status = 'no_show' THEN 1 ELSE 0 END) as tickets_no_show,
      ROUND(IFNULL(AVG(TIMESTAMPDIFF(SECOND, t.created_at, t.called_at)), 0) / 60, 1) as avg_wait_time,
      ROUND(IFNULL(AVG(TIMESTAMPDIFF(SECOND, t.called_at, t.finished_at)), 0) / 60, 1) as avg_processing_time
    FROM tickets t
    WHERE ${fullFilter}
  `;

  db.query(kpiQuery, params, (err, kpiResults) => {
    if (err) return res.status(500).json({ error: 'KPI Query Error: ' + err.message });
    results.kpis = kpiResults[0];

    // 2. Customer Flow Analysis
    const flowQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN t.status = 'no_show' OR t.status = 'cancelled' THEN 1 ELSE 0 END) as drop_offs,
        ROUND(IFNULL(AVG(TIMESTAMPDIFF(SECOND, t.created_at, t.called_at)), 0) / 60, 1) as avg_wait_mins,
        ROUND(IFNULL(AVG(TIMESTAMPDIFF(SECOND, t.called_at, t.finished_at)), 0) / 60, 1) as avg_serve_mins
      FROM tickets t
      WHERE ${fullFilter}
    `;

    db.query(flowQuery, params, (err, flowResults) => {
      if (err) return res.status(500).json({ error: 'Flow Query Error: ' + err.message });
      results.customerFlow = flowResults[0];

      // 3. Hourly Traffic
      const trafficQuery = `
        SELECT HOUR(t.created_at) as hour, COUNT(*) as count
        FROM tickets t
        WHERE ${fullFilter}
        GROUP BY HOUR(t.created_at)
        ORDER BY hour ASC
      `;

      db.query(trafficQuery, params, (err, trafficResults) => {
        if (err) return res.status(500).json({ error: 'Traffic Query Error: ' + err.message });
        results.hourlyTraffic = trafficResults;

        // 4. Counter Efficiency
        const counterQuery = `
          SELECT 
            sp.name as counter_name,
            sp.staff_name,
            COUNT(t.id) as volume,
            ROUND(IFNULL(AVG(TIMESTAMPDIFF(SECOND, t.called_at, t.finished_at)), 0) / 60, 1) as avg_speed
          FROM tickets t
          JOIN service_points sp ON t.service_point_id = sp.id
          WHERE t.status = 'done' AND ${fullFilter}
          GROUP BY t.service_point_id
          ORDER BY volume DESC
        `;

        db.query(counterQuery, params, (err, counterResults) => {
          if (err) return res.status(500).json({ error: 'Counter Query Error: ' + err.message });
          results.counterEfficiency = counterResults;

          // 5. Service Performance (including Delay Rate)
          const servicePerfQuery = `
            SELECT 
              s.name as service_name, 
              COUNT(t.id) as total_tickets,
              ROUND(IFNULL(AVG(TIMESTAMPDIFF(SECOND, t.called_at, t.finished_at)), 0) / 60, 1) as avg_serve_time,
              ROUND(SUM(CASE WHEN TIMESTAMPDIFF(MINUTE, t.called_at, t.finished_at) > 15 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(t.id), 0), 1) as delay_rate
            FROM tickets t
            JOIN services s ON t.service_id = s.id
            WHERE t.status = 'done' AND ${fullFilter}
            GROUP BY t.service_id
          `;

          db.query(servicePerfQuery, params, (err, perfResults) => {
            if (err) return res.status(500).json({ error: 'Service Perf Query Error: ' + err.message });
            results.servicePerformance = perfResults;

            // 6. Status Distribution
            const statusQuery = `
              SELECT t.status, COUNT(*) as count
              FROM tickets t
              WHERE ${fullFilter}
              GROUP BY t.status
            `;

            db.query(statusQuery, params, (err, statusResults) => {
              if (err) return res.status(500).json({ error: 'Status Query Error: ' + err.message });
              results.statusDistribution = statusResults;

              res.json(results);
            });
          });
        });
      });
    });
  });
};

exports.getTicketHistory = (req, res) => {
  const { serviceId, status, startDate, endDate, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  let filter = '1=1';
  const params = [];

  if (serviceId) {
    filter += ' AND t.service_id = ?';
    params.push(serviceId);
  }
  if (status) {
    filter += ' AND t.status = ?';
    params.push(status);
  }
  if (startDate && endDate) {
    filter += ' AND t.created_at BETWEEN ? AND ?';
    params.push(startDate, endDate);
  } else if (startDate) {
    filter += ' AND t.created_at >= ?';
    params.push(startDate);
  } else if (endDate) {
    filter += ' AND t.created_at <= ?';
    params.push(endDate);
  }

  const countQuery = `SELECT COUNT(*) as total FROM tickets t WHERE ${filter}`;
  db.query(countQuery, params, (err, countResult) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    const total = countResult[0].total;

    const query = `
      SELECT 
        t.id, t.status, t.created_at, t.called_at, t.finished_at,
        s.name as service_name,
        ROUND(IFNULL(TIMESTAMPDIFF(SECOND, t.created_at, t.called_at), 0) / 60, 1) as wait_time,
        ROUND(IFNULL(TIMESTAMPDIFF(SECOND, t.called_at, t.finished_at), 0) / 60, 1) as service_time,
        ROUND(IFNULL(TIMESTAMPDIFF(SECOND, t.created_at, IFNULL(t.finished_at, NOW())), 0) / 60, 1) as total_time
      FROM tickets t
      LEFT JOIN services s ON t.service_id = s.id
      WHERE ${filter}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `;

    db.query(query, [...params, Number(limit), Number(offset)], (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ tickets: results, total, page: Number(page), limit: Number(limit) });
    });
  });
};

exports.getAuditLogs = (req, res) => {
  const { serviceId, actionType, startDate, endDate, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  let filter = '1=1';
  const params = [];

  if (serviceId) {
    filter += ' AND a.service_id = ?';
    params.push(serviceId);
  }
  if (actionType) {
    filter += ' AND a.action_type = ?';
    params.push(actionType);
  }
  if (startDate && endDate) {
    filter += ' AND a.created_at BETWEEN ? AND ?';
    params.push(startDate, endDate);
  } else if (startDate) {
    filter += ' AND a.created_at >= ?';
    params.push(startDate);
  } else if (endDate) {
    filter += ' AND a.created_at <= ?';
    params.push(endDate);
  }

  const countQuery = `SELECT COUNT(*) as total FROM audit_logs a WHERE ${filter}`;
  db.query(countQuery, params, (err, countResult) => {
    if (err) return res.status(500).json({ error: 'Database error counting logs' });
    const total = countResult[0].total;

    const query = `
      SELECT 
        a.id, a.action_type, a.ticket_id, a.metadata, a.created_at,
        s.name as service_name,
        u.name as user_name
      FROM audit_logs a
      LEFT JOIN services s ON a.service_id = s.id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE ${filter}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;

    db.query(query, [...params, Number(limit), Number(offset)], (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error fetching logs' });
      res.json({ logs: results, total, page: Number(page), limit: Number(limit) });
    });
  });
};
