const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('../db');
require('dotenv').config();

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

module.exports = passport;
