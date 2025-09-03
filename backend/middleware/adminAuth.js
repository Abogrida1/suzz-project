const { authenticateToken } = require('./auth');

// Super admin credentials
const SUPER_ADMIN_EMAIL = 'madoabogrida05@gmail.com';
const SUPER_ADMIN_PASSWORD = 'batta1';

// Middleware to check if user is super admin
const authenticateSuperAdmin = async (req, res, next) => {
  try {
    // First authenticate the token
    await new Promise((resolve, reject) => {
      authenticateToken(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Check if user is super admin
    if (req.user.email === SUPER_ADMIN_EMAIL) {
      next();
    } else {
      res.status(403).json({ message: 'Access denied. Super admin privileges required.' });
    }
  } catch (error) {
    res.status(401).json({ message: 'Authentication required' });
  }
};

module.exports = { authenticateSuperAdmin };
