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
  
  // Check admin credentials OR if user is already an admin OR if user is the specific admin email
  if ((username === ADMIN_USERNAME && password === ADMIN_PASSWORD) || 
      req.user.isAdmin() || 
      req.user.email === ADMIN_USERNAME) {
    next();
  } else {
    res.status(403).json({ message: 'Invalid admin credentials' });
  }
};

// Middleware to check specific admin permissions
const requireAdminPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Super admin has all permissions
    if (req.user.isSuperAdmin && req.user.isSuperAdmin()) {
      return next();
    }

    // Check if user is the specific admin email (fallback)
    if (req.user.email === ADMIN_USERNAME) {
      return next();
    }

    // Check if user has the required permission
    if (req.user.hasPermission && req.user.hasPermission(permission)) {
      next();
    } else {
      res.status(403).json({ message: `Permission required: ${permission}` });
    }
  };
};

// Middleware to check if user can manage admins
const canManageAdmins = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Super admin can always manage admins
  if (req.user.isSuperAdmin && req.user.isSuperAdmin()) {
    return next();
  }

  // Check if user is the specific admin email (fallback)
  if (req.user.email === ADMIN_USERNAME) {
    return next();
  }

  // Check if user has canManageAdmins permission
  if (req.user.canManageAdmins && req.user.canManageAdmins()) {
    next();
  } else {
    res.status(403).json({ message: 'Admin management permission required' });
  }
};

// Simple admin auth for any authenticated user (fallback)
const simpleAdminAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

module.exports = { 
  adminAuth, 
  simpleAdminAuth, 
  requireAdminPermission, 
  canManageAdmins 
};
