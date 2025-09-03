const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { adminAuth, canManageAdmins, requireAdminPermission } = require('../middleware/adminAuth');

// Get all admins
router.post('/admins', adminAuth, requireAdminPermission('canManageAdmins'), async (req, res) => {
  try {
    const admins = await User.find({ 
      role: { $in: ['admin', 'super_admin', 'moderator'] } 
    }, 'username displayName email role adminPermissions addedBy addedAt createdAt')
      .populate('addedBy', 'username displayName')
      .sort({ role: 1, createdAt: -1 });
    
    res.json({ admins });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ message: 'Failed to fetch admins' });
  }
});

// Add new admin
router.post('/admins/add', adminAuth, requireAdminPermission('canManageAdmins'), async (req, res) => {
  try {
    const { 
      username, 
      email, 
      displayName, 
      role = 'admin',
      permissions = {}
    } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already an admin
    if (existingUser.isAdmin()) {
      return res.status(400).json({ message: 'User is already an admin' });
    }

    // Update user role and permissions
    existingUser.role = role;
    existingUser.adminPermissions = {
      canManageUsers: permissions.canManageUsers || false,
      canManageMessages: permissions.canManageMessages || false,
      canManageGroups: permissions.canManageGroups || false,
      canViewAnalytics: permissions.canViewAnalytics || false,
      canManageAdmins: permissions.canManageAdmins || false,
      canDeleteGlobalMessages: permissions.canDeleteGlobalMessages || false,
      canBanUsers: permissions.canBanUsers || false
    };
    existingUser.addedBy = req.user._id;
    existingUser.addedAt = new Date();

    await existingUser.save();

    res.json({ 
      message: 'Admin added successfully',
      admin: {
        _id: existingUser._id,
        username: existingUser.username,
        displayName: existingUser.displayName,
        email: existingUser.email,
        role: existingUser.role,
        adminPermissions: existingUser.adminPermissions
      }
    });
  } catch (error) {
    console.error('Add admin error:', error);
    res.status(500).json({ message: 'Failed to add admin' });
  }
});

// Update admin permissions
router.put('/admins/:adminId/permissions', adminAuth, requireAdminPermission('canManageAdmins'), async (req, res) => {
  try {
    const { adminId } = req.params;
    const { permissions, role } = req.body;

    const admin = await User.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Don't allow modifying super admin
    if (admin.isSuperAdmin()) {
      return res.status(400).json({ message: 'Cannot modify super admin' });
    }

    // Update permissions
    if (permissions) {
      admin.adminPermissions = {
        canManageUsers: permissions.canManageUsers || false,
        canManageMessages: permissions.canManageMessages || false,
        canManageGroups: permissions.canManageGroups || false,
        canViewAnalytics: permissions.canViewAnalytics || false,
        canManageAdmins: permissions.canManageAdmins || false,
        canDeleteGlobalMessages: permissions.canDeleteGlobalMessages || false,
        canBanUsers: permissions.canBanUsers || false
      };
    }

    if (role && role !== 'super_admin') {
      admin.role = role;
    }

    await admin.save();

    res.json({ 
      message: 'Admin permissions updated successfully',
      admin: {
        _id: admin._id,
        username: admin.username,
        displayName: admin.displayName,
        email: admin.email,
        role: admin.role,
        adminPermissions: admin.adminPermissions
      }
    });
  } catch (error) {
    console.error('Update admin permissions error:', error);
    res.status(500).json({ message: 'Failed to update admin permissions' });
  }
});

// Remove admin
router.delete('/admins/:adminId', adminAuth, requireAdminPermission('canManageAdmins'), async (req, res) => {
  try {
    const { adminId } = req.params;

    const admin = await User.findById(adminId);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Don't allow removing super admin
    if (admin.isSuperAdmin()) {
      return res.status(400).json({ message: 'Cannot remove super admin' });
    }

    // Reset to regular user
    admin.role = 'user';
    admin.adminPermissions = {
      canManageUsers: false,
      canManageMessages: false,
      canManageGroups: false,
      canViewAnalytics: false,
      canManageAdmins: false,
      canDeleteGlobalMessages: false,
      canBanUsers: false
    };
    admin.addedBy = null;
    admin.addedAt = null;

    await admin.save();

    res.json({ message: 'Admin removed successfully' });
  } catch (error) {
    console.error('Remove admin error:', error);
    res.status(500).json({ message: 'Failed to remove admin' });
  }
});

// Get admin permission templates
router.post('/admin-templates', adminAuth, requireAdminPermission('canManageAdmins'), async (req, res) => {
  try {
    const templates = {
      moderator: {
        name: 'Moderator',
        description: 'Basic moderation powers',
        permissions: {
          canManageMessages: true,
          canBanUsers: true
        }
      },
      admin: {
        name: 'Admin',
        description: 'Full administrative access',
        permissions: {
          canManageUsers: true,
          canManageMessages: true,
          canManageGroups: true,
          canViewAnalytics: true,
          canDeleteGlobalMessages: true,
          canBanUsers: true
        }
      },
      senior_admin: {
        name: 'Senior Admin',
        description: 'Advanced administrative powers',
        permissions: {
          canManageUsers: true,
          canManageMessages: true,
          canManageGroups: true,
          canViewAnalytics: true,
          canManageAdmins: true,
          canDeleteGlobalMessages: true,
          canBanUsers: true
        }
      }
    };

    res.json({ templates });
  } catch (error) {
    console.error('Get admin templates error:', error);
    res.status(500).json({ message: 'Failed to fetch admin templates' });
  }
});

module.exports = router;
