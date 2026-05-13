// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('./config/passport'); // Custom passport config

// Route Imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const queueRoutes = require('./routes/queueRoutes');
const supportRoutes = require('./routes/supportRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const servicePointRoutes = require('./routes/servicePointRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const faqRoutes = require('./routes/faqRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
const port = 3001;

// --- Middleware ---
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
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

// --- Routes ---
// Health Check
app.get('/hello', (req, res) => {
  res.json({ message: 'Backend is working' });
});

// Domain Mounts
app.use('/', authRoutes);             // Has /register, /login, /auth/*
app.use('/', analyticsRoutes);        // Has /stats, /analytics
app.use('/users', userRoutes);
app.use('/services', serviceRoutes);
app.use('/admin', adminRoutes);
app.use('/tickets', ticketRoutes);
app.use('/queue', queueRoutes);       // Mounts to /queue-live internally
app.use('/support', supportRoutes);   // Mounts to /support-requests and /support
app.use('/service-points', servicePointRoutes);
app.use('/settings', settingsRoutes);
app.use('/faqs', faqRoutes);
app.use('/upload', uploadRoutes);

// --- Start the Server ---
app.listen(port, () => {
  console.log(`Server is running! You can test it at: http://localhost:${port}/hello`);
});

// --- Stability & Error Handling ---
process.on('uncaughtException', (err) => {
  console.error('There was an uncaught error', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
