// server.js
// Import the required packages
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const db = require('./db'); // Import the database connection
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
require('dotenv').config();

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

// Session middleware for passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

const requireAdmin = (req, res, next) => {
  const role = req.headers['x-user-role'];
  if (role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Passport Google OAuth Strategy
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (googleClientId && googleClientSecret && googleClientId !== 'your_google_client_id_here') {
  passport.use(new GoogleStrategy({
    clientID: googleClientId,
    clientSecret: googleClientSecret,
    callbackURL: "/auth/google/callback",
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists in database
    const email = profile.emails[0].value;
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
      if (err) {
        return done(err);
      }
      
      if (results.length > 0) {
        // User exists, return user
        const user = results[0];
        return done(null, user);
      } else {
        // User doesn't exist, create new user
        const name = profile.displayName;
        const newUser = {
          name: name,
          email: email,
          password: null, // OAuth users don't have passwords
          role: 'user'
        };
        
        db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', 
          [newUser.name, newUser.email, newUser.password, newUser.role], 
          (err, result) => {
            if (err) {
              return done(err);
            }
            
            newUser.id = result.insertId;
            return done(null, newUser);
          });
      }
    });
  } catch (error) {
    return done(error);
  }
}));
} else {
  console.log('Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file');
}

// Serialize and deserialize user for session management
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.query('SELECT * FROM users WHERE id = ?', [id], (err, results) => {
    if (err) {
      return done(err);
    }
    done(null, results[0]);
  });
});

// --- Routes ---

// 1. Get Users Route: GET /users
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
  res.json({ message: 'Backend is working' });
});

// 3. Register Route: POST /register
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please provide name, email, and password' });
  }
  
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
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
      
      // If password matches, fetch the service_id from staff_assignments
      db.query('SELECT service_id FROM staff_assignments WHERE user_id = ? LIMIT 1', [user.id], (err, saResults) => {
        let serviceId = null;
        if (!err && saResults.length > 0) {
          serviceId = saResults[0].service_id;
        }
        
        res.json({
          message: 'Login successful!',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            serviceId: serviceId
          }
        });
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error during password verification' });
    }
  });
});

// Google OAuth Routes
// 5. Google OAuth Start
app.get('/auth/google', (req, res) => {
  if (!googleClientId || !googleClientSecret || googleClientId === 'your_google_client_id_here') {
    return res.status(500).json({ 
      error: 'Google OAuth not configured',
      message: 'Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file'
    });
  }
  passport.authenticate('google')(req, res);
});

// 6. Google OAuth Callback
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: 'http://localhost:5173/register?error=google_auth_failed' }),
  (req, res) => {
    const user = req.user;
    
    db.query('SELECT service_id FROM staff_assignments WHERE user_id = ? LIMIT 1', [user.id], (err, saResults) => {
      let serviceId = null;
      if (!err && saResults.length > 0) {
        serviceId = saResults[0].service_id;
      }
      
      const userData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        serviceId: serviceId
      };
      
      req.session.oauthUser = userData;
      
      res.redirect('http://localhost:5173/auth-success');
    });
  }
);

// 7. Get Current User
app.get('/auth/user', (req, res) => {
  if (req.isAuthenticated()) {
    // Fetch service_id if user is staff
    db.query('SELECT service_id FROM staff_assignments WHERE user_id = ? LIMIT 1', [req.user.id], (err, saResults) => {
      let serviceId = null;
      if (!err && saResults.length > 0) {
        serviceId = saResults[0].service_id;
      }
      
      res.json({
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          serviceId: serviceId
        }
      });
    });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// 8. Logout
app.post('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/auth/oauth-user', (req, res) => {
  if (req.session.oauthUser) {
    const userData = req.session.oauthUser;
    delete req.session.oauthUser;
    res.json({ user: userData });
  } else {
    res.status(401).json({ error: 'No pending OAuth session' });
  }
});

// 9. Get Services Route: GET /services
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

// 10. Create Service Route: POST /services
app.post('/services', async (req, res) => {
  const { 
    name, 
    category, 
    description, 
    icon, 
    estimated_wait_time, 
    color_theme, 
    is_fast_track_available, 
    is_open, 
    max_capacity, 
    address, 
    lat, 
    lng 
  } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Service name is required' });
  }
  
  try {
    const query = `
      INSERT INTO services (
        name, category, description, icon, estimated_wait_time, 
        color_theme, is_fast_track_available, is_open, max_capacity, 
        address, lat, lng
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.query(query, [
      name,
      category || null,
      description || null,
      icon || null,
      estimated_wait_time || null,
      color_theme || null,
      is_fast_track_available || false,
      is_open !== false,
      max_capacity || null,
      address || null,
      lat || null,
      lng || null
    ], (err, result) => {
      if (err) {
        console.error('Error creating service:', err);
        return res.status(500).json({ error: 'Failed to create service' });
      }
      
      res.status(201).json({
        message: 'Service created successfully',
        service: {
          id: result.insertId,
          name,
          category: category || null,
          description: description || null,
          icon: icon || null,
          estimated_wait_time: estimated_wait_time || null,
          color_theme: color_theme || null,
          is_fast_track_available: is_fast_track_available || false,
          is_open: is_open !== false,
          max_capacity: max_capacity || null,
          address: address || null,
          lat: lat || null,
          lng: lng || null
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during service creation' });
  }
});

// 11. Update Service Route: PUT /services/:id
app.put('/services/:id', async (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    category, 
    description, 
    icon, 
    estimated_wait_time, 
    color_theme, 
    is_fast_track_available, 
    is_open, 
    max_capacity, 
    address, 
    lat, 
    lng 
  } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Service name is required' });
  }
  
  try {
    const query = `
      UPDATE services SET 
        name = ?, category = ?, description = ?, icon = ?, estimated_wait_time = ?, 
        color_theme = ?, is_fast_track_available = ?, is_open = ?, max_capacity = ?, 
        address = ?, lat = ?, lng = ?
      WHERE id = ?
    `;
    
    db.query(query, [
      name,
      category || null,
      description || null,
      icon || null,
      estimated_wait_time || null,
      color_theme || null,
      is_fast_track_available || false,
      is_open !== false,
      max_capacity || null,
      address || null,
      lat || null,
      lng || null,
      id
    ], (err, result) => {
      if (err) {
        console.error('Error updating service:', err);
        return res.status(500).json({ error: 'Failed to update service' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Service not found' });
      }
      
      res.json({
        message: 'Service updated successfully',
        service: {
          id: parseInt(id),
          name,
          category: category || null,
          description: description || null,
          icon: icon || null,
          estimated_wait_time: estimated_wait_time || null,
          color_theme: color_theme || null,
          is_fast_track_available: is_fast_track_available || false,
          is_open: is_open !== false,
          max_capacity: max_capacity || null,
          address: address || null,
          lat: lat || null,
          lng: lng || null
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during service update' });
  }
});

// 12. Delete Service Route: DELETE /services/:id
app.delete('/services/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // First check if service has any tickets
    db.query('SELECT COUNT(*) as count FROM tickets WHERE service_id = ?', [id], (err, ticketResults) => {
      if (err) {
        console.error('Error checking service tickets:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (ticketResults[0].count > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete service with existing tickets',
          message: 'Please resolve all tickets for this service before deleting'
        });
      }
      
      // Delete the service
      db.query('DELETE FROM services WHERE id = ?', [id], (err, result) => {
        if (err) {
          console.error('Error deleting service:', err);
          return res.status(500).json({ error: 'Failed to delete service' });
        }
        
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: 'Service not found' });
        }
        
        res.json({ message: 'Service deleted successfully' });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during service deletion' });
  }
});

// 13. Get Admin Accounts Route: GET /admin/accounts
app.get('/admin/accounts', (req, res) => {
  const query = `
    SELECT id, name, email, phone_number, role, is_active, created_at
    FROM users 
    WHERE role IN ('admin', 'super_admin', 'staff')
    ORDER BY created_at DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching admin accounts:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    res.json(results);
  });
});

// 14. Create Admin Account Route: POST /admin/accounts
app.post('/admin/accounts', async (req, res) => {
  const { name, email, password, phone_number, role, is_active } = req.body;
  
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
        
        res.status(201).json({
          message: 'Admin account created successfully',
          admin: {
            id: result.insertId,
            name,
            email,
            phone_number: phone_number || null,
            role,
            is_active: is_active !== false
          }
        });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during admin account creation' });
  }
});

// 15. Update Admin Account Route: PUT /admin/accounts/:id
app.put('/admin/accounts/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, password, phone_number, role, is_active } = req.body;
  
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
        
        if (updateFields.length === 0) {
          return res.status(400).json({ error: 'No changes provided' });
        }
        
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(id);
        
        const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
        
        db.query(updateQuery, updateValues, (updateErr, updateResult) => {
          if (updateErr) {
            console.error('Error updating admin account:', updateErr);
            return res.status(500).json({ error: 'Failed to update admin account' });
          }
          
          res.json({
            message: 'Admin account updated successfully',
            admin: {
              id: parseInt(id),
              name,
              email,
              phone_number: phone_number || null,
              role: role || existingAdmin.role,
              is_active: is_active !== false
            }
          });
        });
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during admin account update' });
  }
});

// 16. Delete Admin Account Route: DELETE /admin/accounts/:id
app.delete('/admin/accounts/:id', async (req, res) => {
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
      
      if (admin.role === 'super_admin') {
        return res.status(400).json({ error: 'Cannot delete super admin account' });
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
  } catch (error) {
    res.status(500).json({ error: 'Server error during admin account deletion' });
  }
});

// 6. Post Tickets Route: POST /tickets
app.post('/tickets', (req, res) => {
  const { userId, serviceId } = req.body;
  
  if (!userId || !serviceId) {
    return res.status(400).json({ error: 'userId and serviceId are required' });
  }

  // Step 1: Verify the user exists (catches stale localStorage after schema migration)
  db.query('SELECT id FROM users WHERE id = ?', [userId], (err, userRows) => {
    if (err) {
      console.error('User check error:', err.message);
      return res.status(500).json({ error: 'Database error checking user' });
    }
    if (userRows.length === 0) {
      return res.status(401).json({ error: 'Session expired. Please log out and log in again.' });
    }

    // Step 2: Check if service is open and get ticket prefix/counter
    db.query('SELECT is_open, ticket_prefix, ticket_counter FROM services WHERE id = ?', [serviceId], (err, svcRows) => {
      if (err) {
        console.error('Service check error:', err.message);
        return res.status(500).json({ error: 'Database error checking service' });
      }
      if (svcRows.length === 0) return res.status(404).json({ error: 'Service not found' });
      if (!svcRows[0].is_open) return res.status(403).json({ error: 'Service is currently closed' });

      const { ticket_prefix, ticket_counter } = svcRows[0];
      const newCounter = ticket_counter + 1;

      // Step 3: Atomically increment counter and insert the ticket
      db.query('UPDATE services SET ticket_counter = ? WHERE id = ?', [newCounter, serviceId], (err) => {
        if (err) {
          console.error('Counter update error:', err.message);
          return res.status(500).json({ error: 'Database error updating counter' });
        }

        const insertQuery = `INSERT INTO tickets (user_id, service_id, status, queue_number) VALUES (?, ?, 'waiting', ?)`;
        db.query(insertQuery, [userId, serviceId, newCounter], (err, result) => {
          if (err) {
            console.error('Ticket insert error:', err.message);
            return res.status(500).json({ error: `Could not create ticket: ${err.message}` });
          }
          res.json({ success: true, ticketId: result.insertId, queueNumber: newCounter, ticketPrefix: ticket_prefix, message: 'Ticket created successfully' });
        });
      });
    });
  });
});


// 7. Get User Tickets Route: GET /tickets/user/:userId
app.get('/tickets/user/:userId', (req, res) => {
  const { userId } = req.params;
  const query = `
    SELECT t.*, s.name as service_name, s.category as service_category, s.icon as service_icon, s.color_theme, s.estimated_wait_time, s.ticket_prefix
    FROM tickets t
    JOIN services s ON t.service_id = s.id
    WHERE t.user_id = ? AND t.status IN ('waiting', 'paused', 'called')
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
    
    // Count how many tickets for this service (waiting, called, or paused) have an earlier timestamp
    const q = 'SELECT COUNT(*) as position FROM tickets WHERE service_id = ? AND status IN ("waiting", "called", "paused") AND created_at < ?';
    db.query(q, [service_id, created_at], (err, countRes) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ position: countRes[0].position });
    });
  });
});

app.patch('/tickets/:id', requireAdmin, (req, res) => {
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

app.patch('/tickets/:id/self', (req, res) => {
  const { id } = req.params;
  const { status, userId } = req.body;
  
  if (!status) return res.status(400).json({ error: 'Status is required' });
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  if (!['paused', 'waiting', 'cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  db.query('SELECT user_id, status FROM tickets WHERE id = ?', [id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    if (results[0].user_id !== userId) return res.status(403).json({ error: 'You can only modify your own tickets' });

    const currentStatus = results[0].status;
    if (currentStatus === 'cancelled' || currentStatus === 'done') {
      return res.status(400).json({ error: 'Cannot modify a ' + currentStatus + ' ticket' });
    }

    let query = '';
    let values = [];

    if (status === 'paused') {
      query = `UPDATE tickets SET status = 'paused', is_paused = 1, paused_at = NOW() WHERE id = ?`;
      values = [id];
    } else if (status === 'waiting') {
      query = `UPDATE tickets SET status = 'waiting', is_paused = 0, paused_at = NULL WHERE id = ?`;
      values = [id];
    } else if (status === 'cancelled') {
      query = `UPDATE tickets SET status = 'cancelled', is_paused = 0, paused_at = NULL WHERE id = ?`;
      values = [id];
    }

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Error updating ticket status:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Ticket updated successfully' });
    });
  });
});

// 8b. REMOVED: duplicate /tickets/call-next route was here — see route #12 below for the correct implementation.

// 9a. Public Queue Live Feed: GET /queue-live  (no auth required — used by QueueTrackingPage)
app.get('/queue-live', (req, res) => {
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
});

// 9. Get FAQs Route: GET /faqs
app.get('/faqs', (req, res) => {
  db.query('SELECT * FROM faqs WHERE is_active = 1', (err, results) => {
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
app.get('/tickets', requireAdmin, (req, res) => {
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
app.post('/tickets/call-next', requireAdmin, (req, res) => {
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

app.post('/settings', requireAdmin, (req, res) => {
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

app.post('/service-points', requireAdmin, (req, res) => {
  const { serviceId, name, staffName } = req.body;
  const query = 'INSERT INTO service_points (service_id, name, staff_name) VALUES (?, ?, ?)';
  db.query(query, [serviceId, name, staffName], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Service point created', id: result.insertId });
  });
});

// 13. Support Endpoints
app.get('/support', requireAdmin, (req, res) => {
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
  db.query(query, [userId || null, serviceId || null, subject, message], (err, result) => {
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
