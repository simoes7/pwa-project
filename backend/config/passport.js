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
      const email = profile.emails[0].value;
      const googleId = profile.id;
      const name = profile.displayName;

      // 1. Try to find user by googleId
      db.query('SELECT * FROM users WHERE google_id = ?', [googleId], (err, results) => {
        if (err) return done(err);

        if (results.length > 0) {
          // User exists with this Google account
          return done(null, results[0]);
        } else {
          // 2. Try to find user by email (maybe they registered normally before)
          db.query('SELECT * FROM users WHERE email = ?', [email], (err, emailResults) => {
            if (err) return done(err);

            if (emailResults.length > 0) {
              // User exists with this email, link the Google account
              const user = emailResults[0];
              db.query('UPDATE users SET google_id = ? WHERE id = ?', [googleId, user.id], (err) => {
                if (err) return done(err);
                user.google_id = googleId;
                return done(null, user);
              });
            } else {
              // 3. Create new user
              const newUser = {
                name: name,
                email: email,
                google_id: googleId,
                password: null,
                role: 'user'
              };

              db.query('INSERT INTO users (name, email, google_id, password, role) VALUES (?, ?, ?, ?, ?)',
                [newUser.name, newUser.email, newUser.google_id, newUser.password, newUser.role],
                (err, result) => {
                  if (err) return done(err);
                  newUser.id = result.insertId;
                  return done(null, newUser);
                });
            }
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
