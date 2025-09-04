const { authenticateToken } = require('./auth');

// Admin credentials for access
const ADMIN_USERNAME = 'madoabogrida05@gmail.com';
const ADMIN_PASSWORD = 'batta1';

// Middleware to check admin access with separate credentials
const adminAuth = (req, res, next) => {
  // Get admin credentials from request body
  const { username, password } = req.body;
  
  console.log('AdminAuth - checking credentials:', { username, password: password ? '***' : 'empty' });
  
  // Check admin credentials first (primary method)
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    console.log('AdminAuth - credentials valid');
    next();
    return;
  }
  
  // Check if user is authenticated and is admin (fallback)
  if (req.user) {
    console.log('AdminAuth - checking user:', { email: req.user.email, username: req.user.username });
    
    if (req.user.isAdmin && req.user.isAdmin()) {
      console.log('AdminAuth - user is admin');
      next();
      return;
    }
    
    if (req.user.email === ADMIN_USERNAME) {
      console.log('AdminAuth - user is creator email');
      next();
      return;
    }
  }
  
  console.log('AdminAuth - access denied');
  res.status(403).json({ message: 'Invalid admin credentials' });
};

// Middleware to check specific admin permissions
const requireAdminPermission = (permission) => {
  return (req, res, next) => {
    console.log('RequireAdminPermission - checking permission:', permission);
    
    // If admin credentials are valid, grant all permissions
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      console.log('RequireAdminPermission - admin credentials valid, granting permission');
      return next();
    }
    
    // Check if user is authenticated
    if (!req.user) {
      console.log('RequireAdminPermission - no user found');
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Super admin has all permissions
    if (req.user.isSuperAdmin && req.user.isSuperAdmin()) {
      console.log('RequireAdminPermission - user is super admin');
      return next();
    }

    // Check if user is the specific admin email (fallback)
    if (req.user.email === ADMIN_USERNAME) {
      console.log('RequireAdminPermission - user is creator email');
      return next();
    }

    // Check if user has the required permission
    if (req.user.hasPermission && req.user.hasPermission(permission)) {
      console.log('RequireAdminPermission - user has permission');
      next();
    } else {
      console.log('RequireAdminPermission - permission denied');
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
