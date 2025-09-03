const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-zA-Z0-9_]+$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  avatar: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'away', 'busy'],
    default: 'offline'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  bio: {
    type: String,
    maxlength: 200,
    default: ''
  },
  // Admin system
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin', 'super_admin'],
    default: 'user'
  },
  adminPermissions: {
    canManageUsers: {
      type: Boolean,
      default: false
    },
    canManageMessages: {
      type: Boolean,
      default: false
    },
    canManageGroups: {
      type: Boolean,
      default: false
    },
    canViewAnalytics: {
      type: Boolean,
      default: false
    },
    canManageAdmins: {
      type: Boolean,
      default: false
    },
    canDeleteGlobalMessages: {
      type: Boolean,
      default: false
    },
    canBanUsers: {
      type: Boolean,
      default: false
    }
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  addedAt: {
    type: Date,
    default: null
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isOnline: {
    type: Boolean,
    default: false
  },
  socketId: {
    type: String,
    default: null
  },
  settings: {
    notifications: {
      messageNotifications: { type: Boolean, default: true },
      soundNotifications: { type: Boolean, default: true },
      emailNotifications: { type: Boolean, default: false },
      pushNotifications: { type: Boolean, default: true }
    },
    privacy: {
      showOnlineStatus: { type: Boolean, default: true },
      showLastSeen: { type: Boolean, default: true },
      allowDirectMessages: { type: Boolean, default: true },
      profileVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'public' }
    },
    appearance: {
      theme: { type: String, enum: ['light', 'dark'], default: 'light' },
      fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
      language: { type: String, default: 'en' },
      compactMode: { type: Boolean, default: false }
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ isOnline: 1 });
userSchema.index({ role: 1 });

// Admin permission methods
userSchema.methods.isAdmin = function() {
  return ['admin', 'super_admin'].includes(this.role);
};

userSchema.methods.isSuperAdmin = function() {
  return this.role === 'super_admin';
};

userSchema.methods.hasPermission = function(permission) {
  if (this.isSuperAdmin()) return true;
  if (!this.isAdmin()) return false;
  return this.adminPermissions[permission] === true;
};

userSchema.methods.canManageUsers = function() {
  return this.hasPermission('canManageUsers');
};

userSchema.methods.canManageMessages = function() {
  return this.hasPermission('canManageMessages');
};

userSchema.methods.canManageGroups = function() {
  return this.hasPermission('canManageGroups');
};

userSchema.methods.canViewAnalytics = function() {
  return this.hasPermission('canViewAnalytics');
};

userSchema.methods.canManageAdmins = function() {
  return this.hasPermission('canManageAdmins');
};

userSchema.methods.canDeleteGlobalMessages = function() {
  return this.hasPermission('canDeleteGlobalMessages');
};

userSchema.methods.canBanUsers = function() {
  return this.hasPermission('canBanUsers');
};

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  return {
    _id: this._id,
    username: this.username,
    displayName: this.displayName,
    avatar: this.avatar,
    status: this.status,
    lastSeen: this.lastSeen,
    bio: this.bio,
    isOnline: this.isOnline,
    settings: this.settings,
    createdAt: this.createdAt
  };
};

// Update last seen
userSchema.methods.updateLastSeen = function() {
  this.lastSeen = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
