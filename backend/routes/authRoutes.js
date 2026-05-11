const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');
const db = require('../db');

// Local Auth
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/user', authController.getCurrentUser);
router.get('/auth/oauth-user', authController.getOauthUser);

// Google OAuth
router.get('/auth/google', (req, res) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!googleClientId || !googleClientSecret || googleClientId === 'your_google_client_id_here') {
    return res.status(500).json({
      error: 'Google OAuth not configured',
      message: 'Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file'
    });
  }
  passport.authenticate('google')(req, res);
});

router.get('/auth/google/callback',
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

module.exports = router;
