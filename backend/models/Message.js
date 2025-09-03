const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: function() {
      return !this.attachment;
    },
    maxlength: 2000
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'emoji'],
    default: 'text'
  },
  attachment: {
    url: String,
    filename: String,
    size: Number,
    mimeType: String
  },
  chatType: {
    type: String,
    enum: ['global', 'private', 'group'],
    required: true
  },
  recipients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // For private chats, store the other participant
  privateChatWith: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // For group chats
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'seen'],
    default: 'sending'
  },
  deliveryStatus: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'seen'],
      default: 'sent'
    },
    deliveredAt: Date,
    seenAt: Date
  }],
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  replyTo: {
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  // Message reactions
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Message forwarding
  forwarded: {
    type: Boolean,
    default: false
  },
  originalSender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
messageSchema.index({ chatType: 1, createdAt: -1 });
messageSchema.index({ recipients: 1, createdAt: -1 });
messageSchema.index({ privateChatWith: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ groupId: 1, createdAt: -1 });
messageSchema.index({ 'replyTo.sender': 1 });
messageSchema.index({ 'replyTo.sender': 1, createdAt: -1 }); // Compound index for reply queries
messageSchema.index({ deleted: 1, createdAt: -1 });

// Virtual for message age
messageSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Method to mark as read by user
messageSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(read => read.user.toString() === userId.toString());
  
  if (!existingRead) {
    this.readBy.push({ user: userId, readAt: new Date() });
    
    // Update delivery status
    const deliveryStatus = this.deliveryStatus.find(ds => ds.user.toString() === userId.toString());
    if (deliveryStatus) {
      deliveryStatus.status = 'seen';
      deliveryStatus.seenAt = new Date();
    }
    
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Method to mark as delivered
messageSchema.methods.markAsDelivered = function(userId) {
  const deliveryStatus = this.deliveryStatus.find(ds => ds.user.toString() === userId.toString());
  
  if (!deliveryStatus) {
    this.deliveryStatus.push({
      user: userId,
      status: 'delivered',
      deliveredAt: new Date()
    });
  } else if (deliveryStatus.status === 'sent') {
    deliveryStatus.status = 'delivered';
    deliveryStatus.deliveredAt = new Date();
  }
  
  return this.save();
};

// Method to check if message is read by user
messageSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(read => read.user.toString() === userId.toString());
};

// Method to get delivery status for user
messageSchema.methods.getDeliveryStatus = function(userId) {
  const deliveryStatus = this.deliveryStatus.find(ds => ds.user.toString() === userId.toString());
  return deliveryStatus ? deliveryStatus.status : 'sent';
};

// Method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  const existingReaction = this.reactions.find(r => r.user.toString() === userId.toString());
  
  if (existingReaction) {
    // Replace existing reaction with new emoji
    existingReaction.emoji = emoji;
  } else {
    // Add new reaction
    this.reactions.push({ user: userId, emoji });
  }
  
  return this.save();
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId, emoji) {
  if (emoji) {
    // Remove specific emoji reaction
    this.reactions = this.reactions.filter(r => 
      !(r.user.toString() === userId.toString() && r.emoji === emoji)
    );
  } else {
    // Remove all reactions from user
    this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
  }
  return this.save();
};

// Static method to get messages for a chat
messageSchema.statics.getChatMessages = function(chatType, participants, limit = 50, skip = 0) {
  let query = { chatType, deleted: false };
  
  if (chatType === 'private' && participants.length === 2) {
    query.$or = [
      { privateChatWith: participants[0], sender: participants[1] },
      { privateChatWith: participants[1], sender: participants[0] }
    ];
  } else if (chatType === 'global') {
    // Global chat - no additional filters needed
    query.chatType = 'global';
  } else if (chatType === 'group') {
    query.recipients = { $all: participants };
  }
  
  return this.find(query)
    .populate([
      { path: 'sender', select: 'username displayName avatar' },
      { path: 'replyTo.sender', select: 'username displayName avatar' }
    ])
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

module.exports = mongoose.model('Message', messageSchema);
