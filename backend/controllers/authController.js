const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

exports.register = async (req, res) => {
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
};

exports.login = (req, res) => {
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
};

exports.getCurrentUser = (req, res) => {
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
};

exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
};

exports.getOauthUser = (req, res) => {
  if (req.session.oauthUser) {
    const userData = req.session.oauthUser;
    delete req.session.oauthUser;
    res.json({ user: userData });
  } else {
    res.status(401).json({ error: 'No pending OAuth session' });
  }
};
