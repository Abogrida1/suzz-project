const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  allowInvites: {
    type: Boolean,
    default: true
  },
  muteNotifications: {
    type: Boolean,
    default: false
  },
  avatar: {
    type: String,
    default: null
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    allowMemberInvites: {
      type: Boolean,
      default: true
    },
    allowFileSharing: {
      type: Boolean,
      default: true
    },
    memberPermissions: {
      canInvite: {
        type: Boolean,
        default: false
      },
      canViewMembers: {
        type: Boolean,
        default: true
      },
      canLeaveGroup: {
        type: Boolean,
        default: true
      }
    }
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  unreadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
groupSchema.index({ 'members.user': 1 });
groupSchema.index({ admin: 1 });
groupSchema.index({ createdAt: -1 });

// Virtual for member count
groupSchema.virtual('memberCount').get(function() {
  const count = this.members.length;
  console.log(`Virtual memberCount for group ${this.name}: ${count} members`);
  return count;
});

// Method to check if user is member
groupSchema.methods.isMember = function(userId) {
  // Convert to string for comparison
  const userIdStr = userId.toString();
  const adminIdStr = this.admin.toString();
  
  console.log(`isMember check: userId=${userIdStr}, adminId=${adminIdStr}`);
  
  // Check if user is admin
  if (adminIdStr === userIdStr) {
    console.log('User is admin - returning true');
    return true;
  }
  
  // Check if user is in members list
  const isInMembers = this.members.some(member => {
    const memberIdStr = member.user._id.toString();
    console.log(`Checking member: ${memberIdStr} === ${userIdStr}?`);
    return memberIdStr === userIdStr;
  });
  
  console.log(`User is in members list: ${isInMembers}`);
  return isInMembers;
};

// Method to check if user is admin
groupSchema.methods.isAdmin = function(userId) {
  const userIdStr = userId.toString();
  const adminIdStr = this.admin.toString();
  
  // Check if user is the main admin
  if (adminIdStr === userIdStr) {
    return true;
  }
  
  // Check if user is admin in members list
  return this.members.some(member => 
    member.user.toString() === userIdStr && 
    member.role === 'admin'
  );
};

// Method to check if user is moderator or admin
groupSchema.methods.isModerator = function(userId) {
  const userIdStr = userId.toString();
  
  // Check if user is admin (includes main admin)
  if (this.isAdmin(userId)) {
    return true;
  }
  
  // Check if user is moderator in members list
  return this.members.some(member => 
    member.user.toString() === userIdStr && 
    member.role === 'moderator'
  );
};

// Method to add member
groupSchema.methods.addMember = function(userId, role = 'member') {
  if (!this.isMember(userId)) {
    this.members.push({
      user: userId,
      role: role,
      joinedAt: new Date()
    });
  }
};

// Method to remove member
groupSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => 
    member.user.toString() !== userId.toString()
  );
};

// Method to update member role
groupSchema.methods.updateMemberRole = function(userId, newRole) {
  const member = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  if (member) {
    member.role = newRole;
  }
};

// Method to check member permissions
groupSchema.methods.canMemberInvite = function(userId) {
  // Admin and moderators can always invite
  if (this.isModerator(userId)) {
    return true;
  }
  
  // Check if member has invite permission
  return this.settings.memberPermissions.canInvite;
};

// Method to check if member can view other members
groupSchema.methods.canMemberViewMembers = function(userId) {
  // Admin and moderators can always view members
  if (this.isModerator(userId)) {
    return true;
  }
  
  // Check if member has view members permission
  return this.settings.memberPermissions.canViewMembers;
};

// Method to check if member can leave group
groupSchema.methods.canMemberLeave = function(userId) {
  // Admin cannot leave (must transfer admin role first)
  if (this.isAdmin(userId)) {
    return false;
  }
  
  // Check if member has leave permission
  return this.settings.memberPermissions.canLeaveGroup;
};

module.exports = mongoose.model('Group', groupSchema);