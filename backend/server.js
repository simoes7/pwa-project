// server.js
// Import the required packages
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const db = require('./db'); // Import the database connection
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const jwt = require('jsonwebtoken');
const { authenticateToken, requireRole, requireServiceAdmin, JWT_SECRET } = require('./middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });

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

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// Old requireAdmin removed; using new middleware from auth.js

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

// Image Upload Route: POST /upload
app.post('/upload', authenticateToken, requireRole(['super_admin', 'admin']), upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// 1. Get Users Route: GET /users
app.get('/users', authenticateToken, requireRole(['super_admin', 'admin']), (req, res) => {
  // Query the database to get all users
  const query = 'SELECT id, name, email, phone_number, role, is_active, created_at FROM users WHERE role = "user"';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: 'Failed to fetch users from the database' });
    }
    res.json(results);
  });
});

// Update User Role Route: PUT /users/:id/role
app.put('/users/:id/role', authenticateToken, requireRole(['super_admin']), (req, res) => {
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

        // Return success with the new user's details and a JWT token
        const userObj = {
          id: result.insertId,
          name,
          email,
          role: 'user', // Default role
          serviceId: null
        };
        const token = jwt.sign(userObj, JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({
          message: 'User successfully registered!',
          user: userObj,
          token
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

        const userObj = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          serviceId: serviceId
        };
        const token = jwt.sign(userObj, JWT_SECRET, { expiresIn: '24h' });

        res.json({
          message: 'Login successful!',
          user: userObj,
          token
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
app.post('/services', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  const {
    name,
    category,
    description,
    icon,
    color_theme,
    address,
    lat,
    lng,
    phone_number,
    email_address,
    website,
    logo_url,
    banner_url,
    cover_image_url
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Service name is required' });
  }

  try {
    const serviceId = require('crypto').randomUUID();
    const query = `
      INSERT INTO services (
        id, name, category, description, icon, 
        color_theme, address, lat, lng, 
        phone_number, email_address, website, logo_url, banner_url, cover_image_url,
        estimated_wait_time, is_fast_track_available, is_open, max_capacity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [
      serviceId,
      name,
      category || '',
      description || null,
      icon || null,
      color_theme || null,
      address || null,
      lat || null,
      lng || null,
      phone_number || null,
      email_address || null,
      website || null,
      logo_url || null,
      banner_url || null,
      cover_image_url || null,
      10, // default estimated_wait_time
      false, // default is_fast_track_available
      true, // default is_open
      null // default max_capacity
    ], (err, result) => {
      if (err) {
        console.error('Error creating service:', err);
        return res.status(500).json({ error: 'Failed to create service: ' + err.message });
      }

      res.status(201).json({
        message: 'Service created successfully',
        service: {
          id: serviceId,
          name,
          category: category || '',
          description: description || null,
          icon: icon || null,
          color_theme: color_theme || null,
          address: address || null,
          lat: lat || null,
          lng: lng || null,
          phone_number: phone_number || null,
          email_address: email_address || null,
          website: website || null,
          logo_url: logo_url || null,
          banner_url: banner_url || null,
          cover_image_url: cover_image_url || null,
          estimated_wait_time: 10,
          is_fast_track_available: false,
          is_open: true,
          max_capacity: null
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during service creation' });
  }
});

// 11. Update Service Route: PUT /services/:id/info
app.put('/services/:id/info', authenticateToken, requireRole(['super_admin']), async (req, res) => {
  const { id } = req.params;
  const {
    name,
    category,
    description,
    icon,
    color_theme,
    address,
    lat,
    lng,
    phone_number,
    email_address,
    website,
    logo_url,
    banner_url,
    cover_image_url
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Service name is required' });
  }

  try {
    const query = `
      UPDATE services SET 
        name = ?, category = ?, description = ?, icon = ?, 
        color_theme = ?, address = ?, lat = ?, lng = ?,
        phone_number = ?, email_address = ?, website = ?, logo_url = ?, banner_url = ?, cover_image_url = ?
      WHERE id = ?
    `;

    db.query(query, [
      name,
      category || '',
      description || null,
      icon || null,
      color_theme || null,
      address || null,
      lat || null,
      lng || null,
      phone_number || null,
      email_address || null,
      website || null,
      logo_url || null,
      banner_url || null,
      cover_image_url || null,
      id
    ], (err, result) => {
      if (err) {
        console.error('Error updating service info:', err);
        return res.status(500).json({ error: 'Failed to update service info' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Service not found' });
      }

      res.json({
        message: 'Service info updated successfully',
        service: {
          id: id,
          name,
          category: category || '',
          description: description || null,
          icon: icon || null,
          color_theme: color_theme || null,
          address: address || null,
          lat: lat || null,
          lng: lng || null,
          phone_number: phone_number || null,
          email_address: email_address || null,
          website: website || null,
          logo_url: logo_url || null,
          banner_url: banner_url || null,
          cover_image_url: cover_image_url || null
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during service info update' });
  }
});

// 12. Update Service Operations Route: PUT /services/:id/operations
app.put('/services/:id/operations', authenticateToken, requireServiceAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    estimated_wait_time,
    max_capacity,
    is_fast_track_available,
    is_open
  } = req.body;

  try {
    const query = `
      UPDATE services SET 
        estimated_wait_time = ?, max_capacity = ?, is_fast_track_available = ?, is_open = ?
      WHERE id = ?
    `;

    db.query(query, [
      estimated_wait_time || null,
      max_capacity || null,
      is_fast_track_available || false,
      is_open !== false,
      id
    ], (err, result) => {
      if (err) {
        console.error('Error updating service operations:', err);
        return res.status(500).json({ error: 'Failed to update service operations' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Service not found' });
      }

      res.json({
        message: 'Service operations updated successfully'
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error during service update' });
  }
});

// 12.a Get Service Schedules
app.get('/services/:id/schedules', (req, res) => {
  db.query('SELECT * FROM service_schedules WHERE service_id = ? ORDER BY day_of_week ASC', [req.params.id], (err, results) => {
    if (err) {
      console.error('Error fetching schedules:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// 12.b Update Service Schedules
app.put('/services/:id/schedules', authenticateToken, requireServiceAdmin, (req, res) => {
  const { schedules } = req.body;
  const serviceId = req.params.id;

  db.query('DELETE FROM service_schedules WHERE service_id = ?', [serviceId], (err) => {
    if (err) {
      console.error('Error deleting old schedules:', err);
      return res.status(500).json({ error: 'Database error deleting old schedules' });
    }

    if (!schedules || schedules.length === 0) return res.json({ message: 'Schedules cleared' });

    const values = schedules.map(s => [
      serviceId, s.day_of_week, s.morning_open || null, s.morning_close || null,
      s.lunch_start || null, s.lunch_end || null, s.afternoon_open || null,
      s.afternoon_close || null, s.is_closed ? 1 : 0
    ]);

    db.query('INSERT INTO service_schedules (service_id, day_of_week, morning_open, morning_close, lunch_start, lunch_end, afternoon_open, afternoon_close, is_closed) VALUES ?', [values], (err) => {
      if (err) {
        console.error('Error inserting schedules:', err);
        return res.status(500).json({ error: 'Database error inserting schedules' });
      }
      res.json({ message: 'Schedules updated successfully' });
    });
  });
});

// 12. Delete Service Route: DELETE /services/:id
app.delete('/services/:id', authenticateToken, requireRole(['super_admin']), async (req, res) => {
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
app.get('/admin/accounts', authenticateToken, requireRole(['super_admin']), (req, res) => {
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
});

// 14. Create Admin Account Route: POST /admin/accounts
app.post('/admin/accounts', authenticateToken, requireRole(['super_admin']), async (req, res) => {
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
});

// 15. Update Admin Account Route: PUT /admin/accounts/:id
app.put('/admin/accounts/:id', authenticateToken, requireRole(['super_admin']), async (req, res) => {
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
});

// 16. Delete Admin Account Route: DELETE /admin/accounts/:id
app.delete('/admin/accounts/:id', authenticateToken, requireRole(['super_admin']), async (req, res) => {
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
});

// 17. System Analytics Route: GET /admin/analytics
app.get('/admin/analytics', authenticateToken, requireRole(['super_admin']), async (req, res) => {
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
});

// 17b. Professional Analytics Route V2: GET /admin/analytics/v2
app.get('/admin/analytics/v2', authenticateToken, requireRole(['super_admin', 'admin']), (req, res) => {
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
});

// 17c. Ticket History Route: GET /admin/tickets/history
app.get('/admin/tickets/history', authenticateToken, requireRole(['super_admin', 'admin']), (req, res) => {
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
});

// 17d. Audit Logs Route: GET /admin/audit-logs
app.get('/admin/audit-logs', authenticateToken, requireRole(['super_admin', 'admin']), (req, res) => {
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
});

// --- Audit Logger Helper ---
const logSystemAction = (actionType, serviceId, ticketId, userId, metadata = null) => {
  const metaStr = metadata ? JSON.stringify(metadata) : null;
  const q = 'INSERT INTO audit_logs (action_type, service_id, ticket_id, user_id, metadata) VALUES (?, ?, ?, ?, ?)';
  db.query(q, [actionType, serviceId || null, ticketId || null, userId || null, metaStr], (err) => {
    if (err) console.error('Failed to log system action:', err);
  });
};

// 6. Post Tickets Route: POST /tickets
app.post('/tickets', (req, res) => {
  const { userId, serviceId, userName } = req.body;

  if (!userId || !serviceId) {
    return res.status(400).json({ error: 'userId and serviceId are required' });
  }

  const proceedWithUser = (validUserId) => {
    // Step 2: Comprehensive validation before creating ticket
    db.query('SELECT is_open, max_capacity, ticket_prefix, ticket_counter FROM services WHERE id = ?', [serviceId], (err, svcRows) => {
      if (err) return res.status(500).json({ error: 'Database error checking service' });
      if (svcRows.length === 0) return res.status(404).json({ error: 'Service not found' });

      const { is_open, max_capacity, ticket_prefix, ticket_counter } = svcRows[0];

      // 1. Check Global Open Status
      if (!is_open) return res.status(403).json({ error: 'Service is currently closed by administration' });

      // 2. Check Schedule and Business Hours
      const now = new Date();
      const dayNum = now.getDay() === 0 ? 7 : now.getDay();

      db.query('SELECT * FROM service_schedules WHERE service_id = ? AND day_of_week = ?', [serviceId, dayNum], (err, schedRows) => {
        if (err) return res.status(500).json({ error: 'Database error checking schedule' });

        const sched = schedRows[0];
        if (sched && sched.is_closed) return res.status(403).json({ error: 'Service is closed today' });

        if (sched) {
          const timeToMin = (t) => { if (!t) return null; const p = t.split(':'); return parseInt(p[0]) * 60 + parseInt(p[1]); };
          const currentMin = now.getHours() * 60 + now.getMinutes();
          const mOpen = timeToMin(sched.morning_open);
          const mClose = timeToMin(sched.morning_close);
          const aOpen = timeToMin(sched.afternoon_open);
          const aClose = timeToMin(sched.afternoon_close);

          const inMorning = mOpen !== null && mClose !== null && currentMin >= mOpen && currentMin < mClose;
          const inAfternoon = aOpen !== null && aClose !== null && currentMin >= aOpen && currentMin < aClose;

          if (!inMorning && !inAfternoon) {
            let msg = 'Service is currently outside operational hours.';
            if (mOpen !== null) msg += ` (Morning: ${sched.morning_open}-${sched.morning_close})`;
            if (aOpen !== null) msg += ` (Afternoon: ${sched.afternoon_open}-${sched.afternoon_close})`;
            return res.status(403).json({ error: msg });
          }
        }

        // 3. Check Capacity
        db.query('SELECT COUNT(*) as count FROM tickets WHERE service_id = ? AND status IN ("waiting", "called", "paused")', [serviceId], (err, countRows) => {
          if (err) return res.status(500).json({ error: 'Database error checking capacity' });

          const currentCount = countRows[0].count;
          if (max_capacity && currentCount >= max_capacity) {
            return res.status(403).json({ error: 'Queue has reached maximum capacity. Please try again later.' });
          }

          // Step 4: Atomically increment counter and insert the ticket
          const newCounter = ticket_counter + 1;
          db.query('UPDATE services SET ticket_counter = ? WHERE id = ?', [newCounter, serviceId], (err) => {
            if (err) return res.status(500).json({ error: 'Database error updating counter' });

            const insertQuery = `INSERT INTO tickets (user_id, service_id, status, queue_number) VALUES (?, ?, 'waiting', ?)`;
            db.query(insertQuery, [validUserId, serviceId, newCounter], (err, result) => {
              if (err) return res.status(500).json({ error: `Could not create ticket: ${err.message}` });

              const newTicketId = result.insertId;
              logSystemAction('ticket_created', serviceId, newTicketId, validUserId, { queue_number: newCounter });

              res.json({
                success: true,
                ticketId: newTicketId,
                queueNumber: newCounter,
                ticketPrefix: ticket_prefix,
                position: currentCount, // Position is the current count before adding this ticket
                message: 'Ticket created successfully'
              });
            });
          });
        });
      });
    });
  };

  // Step 1: Verify the user exists or create guest user
  if (typeof userId === 'string' && userId.startsWith('guest_')) {
    const guestEmail = `${userId}@guest.local`;
    const guestName = userName || 'Guest';
    // Create guest user
    db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [guestName, guestEmail, '', 'user'], (err, result) => {
      if (err) {
        console.error('Guest creation error:', err.message);
        return res.status(500).json({ error: 'Failed to create guest user' });
      }
      proceedWithUser(result.insertId);
    });
  } else {
    db.query('SELECT id FROM users WHERE id = ?', [userId], (err, userRows) => {
      if (err) {
        console.error('User check error:', err.message);
        return res.status(500).json({ error: 'Database error checking user' });
      }
      if (userRows.length === 0) {
        return res.status(401).json({ error: 'Session expired. Please log out and log in again.' });
      }
      proceedWithUser(userId);
    });
  }
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

// Get intelligent ETA for ticket
app.get('/tickets/:id/eta', (req, res) => {
  const ticketId = req.params.id;

  db.query('SELECT service_id, created_at, status FROM tickets WHERE id = ?', [ticketId], (err, ticketResults) => {
    if (err || ticketResults.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    const { service_id, created_at, status } = ticketResults[0];

    // 1. Get Service Info (Avg time & Active counters)
    db.query('SELECT estimated_wait_time FROM services WHERE id = ?', [service_id], (err, serviceResults) => {
      if (err || serviceResults.length === 0) return res.status(404).json({ error: 'Service not found' });
      const avg_service_time = serviceResults[0].estimated_wait_time || 10;

      db.query('SELECT COUNT(*) as counter_count FROM service_points WHERE service_id = ? AND status = "active"', [service_id], (err, spResults) => {
        const counters = Math.max(1, spResults[0].counter_count || 1);

        // 2. Get currently serving tickets for this service
        db.query('SELECT called_at FROM tickets WHERE service_id = ? AND status = "called" ORDER BY called_at ASC', [service_id], (err, servingTickets) => {

          let total_remaining_serving = 0;
          let is_delayed = false;
          const now = new Date();

          servingTickets.forEach(t => {
            const elapsed = (now - new Date(t.called_at)) / 60000; // in minutes
            const remaining = Math.max(0, avg_service_time - elapsed);
            total_remaining_serving += remaining;
            if (elapsed > avg_service_time) is_delayed = true;
          });

          // 3. Get position in line
          const posQuery = 'SELECT COUNT(*) as position FROM tickets WHERE service_id = ? AND status IN ("waiting", "paused") AND created_at < ?';
          db.query(posQuery, [service_id, created_at], (err, posResults) => {
            if (err) return res.status(500).json({ error: err.message });

            const position = posResults[0].position;

            // 4. Calculate Final ETA (seconds)
            // Logic: (Remaining time of current batch) / Counters + (Waiting batch * avg_time) / Counters
            const eta_minutes = (total_remaining_serving / counters) + (position * avg_service_time / counters);

            // If already called, ETA is 0
            const final_eta_seconds = status === 'called' ? 0 : Math.ceil(eta_minutes * 60);

            res.json({
              status: status,
              eta_seconds: final_eta_seconds,
              position: position,
              avg_service_time: avg_service_time,
              is_delayed: is_delayed,
              show_delay_message: (status === 'waiting' && is_delayed),
              show_approaching_message: (status === 'waiting' && position <= 2 && position > 0),
              eta: new Date(now.getTime() + final_eta_seconds * 1000)
            });
          });
        });
      });
    });
  });
});

app.patch('/tickets/:id', authenticateToken, requireRole(['super_admin', 'admin']), (req, res) => {
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
    db.query('SELECT service_id FROM tickets WHERE id = ?', [id], (err, rows) => {
      if (!err && rows.length > 0) {
        logSystemAction(`ticket_${status}`, rows[0].service_id, id, req.user?.id || null, { status });
      }
    });
    res.json({ message: 'Ticket updated successfully' });
  });
});

app.patch('/tickets/:id/self', (req, res) => {
  const { id } = req.params;
  const { status, userId } = req.body;

  if (!status) return res.status(400).json({ error: 'Status is required' });
  if (!userId) return res.status(400).json({ error: 'userId is required' });
  if (!['paused', 'waiting', 'cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  db.query('SELECT user_id, status, service_id FROM tickets WHERE id = ?', [id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    if (results[0].user_id !== userId) return res.status(403).json({ error: 'You can only modify your own tickets' });

    const currentStatus = results[0].status;
    const serviceId = results[0].service_id;
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
      logSystemAction(`ticket_${status}`, serviceId, id, userId, { status });
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
app.get('/tickets', authenticateToken, requireRole(['super_admin', 'admin']), (req, res) => {
  const { serviceId } = req.query;
  let query = `
    SELECT t.*, u.name as user_name, s.name as service_name, s.estimated_wait_time, sp.name as counter_name
    FROM tickets t
    LEFT JOIN users u ON t.user_id = u.id
    LEFT JOIN services s ON t.service_id = s.id
    LEFT JOIN service_points sp ON t.service_point_id = sp.id
  `;
  const params = [];

  if (serviceId) {
    query += ` WHERE t.service_id = ? `;
    params.push(serviceId);
  }

  query += ` ORDER BY t.created_at DESC LIMIT 100 `;

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching tickets:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const now = new Date();
    const enrichedResults = results.map(t => {
      if (t.status === 'called' && t.called_at) {
        const avg_time = t.estimated_wait_time || 10;
        const elapsed_ms = now - new Date(t.called_at);
        const elapsed_mins = elapsed_ms / 60000;
        let progress = (elapsed_mins / avg_time) * 100;

        return {
          ...t,
          elapsed_time_mins: Math.floor(elapsed_mins),
          elapsed_time_secs: Math.floor((elapsed_ms / 1000) % 60),
          remaining_time_mins: Math.max(0, Math.ceil(avg_time - elapsed_mins)),
          progress_percentage: Math.min(150, Math.round(progress)),
          is_delayed: elapsed_mins > avg_time
        };
      }
      return t;
    });

    res.json(enrichedResults);
  });
});
// 20. Call Next Ticket: POST /tickets/call-next
app.post('/tickets/call-next', authenticateToken, requireRole(['admin', 'staff', 'super_admin']), (req, res) => {
  const { serviceId, servicePointId } = req.body;
  if (!serviceId) return res.status(400).json({ error: 'serviceId is required' });

  // Step 1: Find the next waiting ticket for this service
  const query = `
    SELECT * FROM tickets 
    WHERE service_id = ? AND status = 'waiting' 
    ORDER BY created_at ASC LIMIT 1
  `;

  db.query(query, [serviceId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error finding next ticket: ' + err.message });
    if (results.length === 0) return res.status(404).json({ error: 'No tickets in queue for this service' });

    const ticketId = results[0].id;

    // Step 2: Update ticket status and assign to service point
    const updateQuery = `
      UPDATE tickets 
      SET status = 'called', called_at = CURRENT_TIMESTAMP, service_point_id = ? 
      WHERE id = ?
    `;

    db.query(updateQuery, [servicePointId || null, ticketId], (err) => {
      if (err) return res.status(500).json({ error: 'Database error updating ticket status: ' + err.message });
      logSystemAction('ticket_called', serviceId, ticketId, req.user?.id || null, { servicePointId });
      res.json({ success: true, message: 'Ticket called successfully', ticketId });
    });
  });
});

// 21. Transfer Ticket: POST /tickets/:id/transfer
app.post('/tickets/:id/transfer', authenticateToken, requireRole(['admin', 'staff', 'super_admin']), (req, res) => {
  const { id } = req.params;
  const { targetServiceId } = req.body;

  if (!targetServiceId) return res.status(400).json({ error: 'targetServiceId is required' });

  db.query('SELECT service_id FROM tickets WHERE id = ?', [id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    const originalServiceId = results[0].service_id;

    const query = `
      UPDATE tickets 
      SET service_id = ?, status = 'waiting', service_point_id = NULL, called_at = NULL 
      WHERE id = ?
    `;

    db.query(query, [targetServiceId, id], (err) => {
      if (err) return res.status(500).json({ error: 'Database error transferring ticket: ' + err.message });
      logSystemAction('ticket_transferred', originalServiceId, id, req.user?.id || null, { targetServiceId });
      res.json({ success: true, message: 'Ticket transferred successfully' });
    });
  });
});


// 13. Get Stats Route: GET /stats
app.get('/stats', (req, res) => {
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

app.post('/settings', authenticateToken, requireRole(['super_admin', 'admin']), (req, res) => {
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

app.post('/service-points', authenticateToken, requireRole(['super_admin', 'admin']), (req, res) => {
  const { serviceId, name, staffName } = req.body;
  const query = 'INSERT INTO service_points (service_id, name, staff_name) VALUES (?, ?, ?)';
  db.query(query, [serviceId, name, staffName], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Service point created', id: result.insertId });
  });
});

// 13. Support Endpoints
app.get('/support', authenticateToken, requireRole(['super_admin', 'admin']), (req, res) => {
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
