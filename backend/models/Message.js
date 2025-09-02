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
    enum: ['sent', 'delivered', 'seen'],
    default: 'sent'
  },
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
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
  }
}, {
  timestamps: true
});

// Indexes for better query performance
messageSchema.index({ chatType: 1, createdAt: -1 });
messageSchema.index({ recipients: 1, createdAt: -1 });
messageSchema.index({ privateChatWith: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });

// Virtual for message age
messageSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Method to mark as read by user
messageSchema.methods.markAsRead = function(userId) {
  const existingRead = this.readBy.find(read => read.user.toString() === userId.toString());
  
  if (!existingRead) {
    this.readBy.push({ user: userId, readAt: new Date() });
    this.status = 'seen';
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Method to check if message is read by user
messageSchema.methods.isReadBy = function(userId) {
  return this.readBy.some(read => read.user.toString() === userId.toString());
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
    .populate('sender', 'username displayName avatar')
    .populate('replyTo')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

module.exports = mongoose.model('Message', messageSchema);
