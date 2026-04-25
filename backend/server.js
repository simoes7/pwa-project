// server.js
// Import the required packages
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const db = require('./db'); // Import the database connection

// Initialize the Express application
const app = express();

// Define the port we want our server to run on
const port = 3001;

// --- Middleware ---
// Use CORS so our frontend (which usually runs on localhost:5173 for Vite)
// can communicate with this backend without getting security errors.
app.use(cors());

// Parse incoming request bodies in JSON format
// This allows us to read req.body in our POST routes
app.use(express.json());


// --- Routes ---

// 1. Test Route: GET /hello
app.get('/hello', (req, res) => {
  // Send a simple text response
  res.send('Backend is working');
});

// 2. Get Users Route: GET /users
app.get('/users', (req, res) => {
  // Query the database to get all users
  const query = 'SELECT * FROM users';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      // Return a 500 Internal Server Error status
      return res.status(500).json({ error: 'Failed to fetch users from the database' });
    }
    
    // Return the list of users as JSON
    res.json(results);
  });
});

// 2. Health Check Route: GET /hello
app.get('/hello', (req, res) => {
  res.json({ message: 'Server is reachable and running!' });
});

// 3. Register Route: POST /register
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please provide name, email, and password' });
  }
  
  try {
    // Check if user already exists
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      
      if (results.length > 0) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }
      
      // Hash the password securely
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Insert the new user into the database
      const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
      db.query(query, [name, email, hashedPassword], (err, result) => {
        if (err) {
          console.error('Error registering user:', err);
          return res.status(500).json({ error: 'Failed to register user' });
        }
        
        // Return success with the new user's details (excluding password)
        res.status(201).json({ 
          message: 'User successfully registered!',
          user: {
            id: result.insertId,
            name,
            email,
            role: 'user' // Default role
          }
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// 4. Login Route: POST /login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide both email and password' });
  }
  
  // Query to find the user by email
  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error('Error during login:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Check if user exists
    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = results[0];
    
    try {
      // Compare the provided password with the hashed password in the database
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      
      // If password matches, return the user data (excluding the password)
      res.json({
        message: 'Login successful!',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          serviceId: user.service_id
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error during password verification' });
    }
  });
});

// 5. Get Services Route: GET /services
app.get('/services', (req, res) => {
  // Query to get all services and calculate how many people are waiting
  const query = `
    SELECT 
      s.*, 
      (SELECT COUNT(*) FROM tickets t WHERE t.service_id = s.id AND t.status = 'waiting') as people_waiting
    FROM services s
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching services:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(results);
  });
});

// 6. Post Tickets Route: POST /tickets
app.post('/tickets', (req, res) => {
  const { userId, serviceId, userName } = req.body;
  
  if (!userId || !serviceId) {
    return res.status(400).json({ error: 'userId and serviceId are required' });
  }

  // Insert the new ticket
  const insertQuery = `INSERT INTO tickets (user_id, service_id, status, user_name) VALUES (?, ?, 'waiting', ?)`;
  
  db.query(insertQuery, [userId, serviceId, userName], (err, result) => {
    if (err) {
      console.error('Error creating ticket:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true, ticketId: result.insertId, message: 'Ticket created successfully' });
  });
});


// 7. Get User Tickets Route: GET /tickets/user/:userId
app.get('/tickets/user/:userId', (req, res) => {
  const { userId } = req.params;
  const query = `
    SELECT t.*, s.name as service_name, s.category as service_category, s.icon as service_icon, s.color_theme
    FROM tickets t
    JOIN services s ON t.service_id = s.id
    WHERE t.user_id = ? AND t.status IN ('waiting', 'paused', 'serving')
    ORDER BY t.created_at DESC
  `;
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user tickets:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// 8. Update Ticket Status: PATCH /tickets/:id
// Get position in line
app.get('/tickets/position/:id', (req, res) => {
  const ticketId = req.params.id;
  
  // Find the ticket first to get its service_id and created_at
  db.query('SELECT service_id, created_at FROM tickets WHERE id = ?', [ticketId], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    
    const { service_id, created_at } = results[0];
    
    // Count how many 'waiting' tickets for this service have an earlier timestamp
    const q = 'SELECT COUNT(*) as position FROM tickets WHERE service_id = ? AND status = "waiting" AND created_at < ?';
    db.query(q, [service_id, created_at], (err, countRes) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ position: countRes[0].position });
    });
  });
});

app.patch('/tickets/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status) return res.status(400).json({ error: 'Status is required' });

  let timestampField = '';
  if (status === 'called') timestampField = ', called_at = NOW()';
  if (status === 'done') timestampField = ', finished_at = NOW()';

  const query = `UPDATE tickets SET status = ? ${timestampField} WHERE id = ?`;
  db.query(query, [status, id], (err, result) => {
    if (err) {
      console.error('Error updating ticket status:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Ticket updated successfully' });
  });
});

// 8b. Call Next Ticket: POST /tickets/call-next
app.post('/tickets/call-next', (req, res) => {
  const { serviceId } = req.body;
  if (!serviceId) return res.status(400).json({ error: 'serviceId is required' });

  const query = `
    UPDATE tickets 
    SET status = 'called', called_at = NOW() 
    WHERE service_id = ? AND status = 'waiting' 
    ORDER BY created_at ASC 
    LIMIT 1
  `;
  
  db.query(query, [serviceId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'No waiting tickets' });
    res.json({ message: 'Next ticket called' });
  });
});

// 9. Get FAQs Route: GET /faqs
app.get('/faqs', (req, res) => {
  db.query('SELECT * FROM faqs', (err, results) => {
    if (err) {
      console.error('Error fetching FAQs:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// 10. Post Support Request: POST /support-requests
app.post('/support-requests', (req, res) => {
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
});

// 11. Get All Tickets (Admin): GET /tickets
app.get('/tickets', (req, res) => {
  const { serviceId } = req.query;
  let query = `
    SELECT t.*, u.name as user_name, s.name as service_name
    FROM tickets t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN services s ON t.service_id = s.id
  `;
  const params = [];
  
  if (serviceId) {
    query += ` WHERE t.service_id = ? `;
    params.push(serviceId);
  }
  
  query += ` ORDER BY t.created_at ASC `;
  
  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching all tickets:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// 12. Call Next Ticket: POST /tickets/call-next
app.post('/tickets/call-next', (req, res) => {
  const { serviceId } = req.body;
  if (!serviceId) return res.status(400).json({ error: 'serviceId is required' });

  // Mark currently called tickets as done
  db.query(`UPDATE tickets SET status = 'done' WHERE service_id = ? AND status = 'called'`, [serviceId], (err) => {
    if (err) return res.status(500).json({ error: 'Database error finishing current' });

    // Find next waiting ticket
    const findNext = `SELECT id FROM tickets WHERE service_id = ? AND status = 'waiting' ORDER BY created_at ASC LIMIT 1`;
    db.query(findNext, [serviceId], (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error finding next' });

      if (results.length > 0) {
        const nextId = results[0].id;
        db.query(`UPDATE tickets SET status = 'called' WHERE id = ?`, [nextId], (err) => {
          if (err) return res.status(500).json({ error: 'Database error calling next' });
          res.json({ success: true, message: 'Next ticket called', ticketId: nextId });
        });
      } else {
        res.json({ success: true, message: 'No more tickets waiting' });
      }
    });
  });
});

// 13. Get Stats Route: GET /stats
app.get('/stats', (req, res) => {
  const { serviceId } = req.query;
  let filterClause = '';
  
  if (serviceId) {
    filterClause = ` AND service_id = ? `;
  }

  const query = `
    SELECT 
      (SELECT COUNT(*) FROM tickets WHERE DATE(created_at) = CURDATE() ${filterClause}) as total_today,
      (SELECT COUNT(*) FROM services ${serviceId ? 'WHERE id = ?' : ''}) as active_services,
      (SELECT ROUND(IFNULL(AVG(TIMESTAMPDIFF(MINUTE, created_at, NOW())), 0)) FROM tickets WHERE status = 'waiting' ${filterClause}) as avg_wait,
      (SELECT COUNT(*) FROM tickets WHERE status = 'called' ${filterClause}) as currently_serving
  `;
  
  const finalParams = [];
  if (serviceId) finalParams.push(serviceId, serviceId, serviceId, serviceId);

  db.query(query, finalParams, (err, results) => {
    if (err) {
      console.error('Error fetching stats:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results[0]);
  });
});

// 14. Get Analytics: GET /analytics
app.get('/analytics', (req, res) => {
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
});

// 11. Settings Endpoints
app.get('/settings', (req, res) => {
  const { serviceId } = req.query;
  const query = 'SELECT * FROM settings' + (serviceId ? ' WHERE service_id = ?' : '');
  db.query(query, serviceId ? [serviceId] : [], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/settings', (req, res) => {
  const { serviceId, key, value } = req.body;
  const query = 'INSERT INTO settings (service_id, setting_key, setting_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?';
  db.query(query, [serviceId, key, value, value], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Setting updated' });
  });
});

// 12. Service Points Endpoints
app.get('/service-points', (req, res) => {
  const { serviceId } = req.query;
  const query = 'SELECT * FROM service_points' + (serviceId ? ' WHERE service_id = ?' : '');
  db.query(query, serviceId ? [serviceId] : [], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/service-points', (req, res) => {
  const { serviceId, name, staffName } = req.body;
  const query = 'INSERT INTO service_points (service_id, name, staff_name) VALUES (?, ?, ?)';
  db.query(query, [serviceId, name, staffName], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Service point created', id: result.insertId });
  });
});

// 13. Support Endpoints
app.get('/support', (req, res) => {
  const { serviceId } = req.query;
  const query = 'SELECT * FROM support_requests' + (serviceId ? ' WHERE service_id = ?' : '') + ' ORDER BY created_at DESC';
  db.query(query, serviceId ? [serviceId] : [], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/support', (req, res) => {
  const { userId, serviceId, subject, message } = req.body;
  const query = 'INSERT INTO support_requests (user_id, service_id, subject, message) VALUES (?, ?, ?, ?)';
  db.query(query, [userId, serviceId, subject, message], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Support request sent', id: result.insertId });
  });
});

// --- Start the Server ---
app.listen(port, () => {
  console.log(`Server is running! You can test it at: http://localhost:${port}/hello`);
});

// --- Stability & Error Handling ---
// This prevents the server from crashing if an unexpected error occurs
process.on('uncaughtException', (err) => {
  console.error('There was an uncaught error', err);
  // In a real app, you might want to restart the server here
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
