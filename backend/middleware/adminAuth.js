const { authenticateToken } = require('./auth');

// Admin credentials for access
const ADMIN_USERNAME = 'madoabogrida05@gmail.com';
const ADMIN_PASSWORD = 'batta1';

// Middleware to check admin access with separate credentials
const adminAuth = (req, res, next) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Get admin credentials from request body
  const { username, password } = req.body;
  
  // Check admin credentials
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    next();
  } else {
    res.status(403).json({ message: 'Invalid admin credentials' });
  }
};

// Simple admin auth for any authenticated user (fallback)
const simpleAdminAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

module.exports = { adminAuth, simpleAdminAuth };
