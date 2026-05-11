const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-super-secret-key-change-in-production';

// Middleware to verify JWT and authenticate user
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    
    // Add user info to request
    req.user = decoded;
    next();
  });
};

// Middleware to check if user has required roles
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

// Specialized middleware for Service Admins (Super Admins OR assigned Admin)
const requireServiceAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Access denied.' });
  }

  // Super admins have access to all services
  if (req.user.role === 'super_admin') {
    return next();
  }

  // Admins must be assigned to the requested service
  if (req.user.role === 'admin') {
    const requestedServiceId = req.params.id || req.body.service_id;
    
    // If the admin's assigned service matches the requested service
    if (req.user.serviceId && req.user.serviceId === requestedServiceId) {
      return next();
    } else {
      return res.status(403).json({ error: 'Access denied. You do not manage this service.' });
    }
  }

  return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
};

module.exports = {
  authenticateToken,
  requireRole,
  requireServiceAdmin,
  JWT_SECRET
};
