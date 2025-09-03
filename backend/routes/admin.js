const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Message = require('../models/Message');
const Group = require('../models/Group');
const { adminAuth } = require('../middleware/adminAuth');

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Admin routes working!' });
});

// Get all users
router.post('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find({}, 'username displayName email createdAt lastSeen')
      .sort({ createdAt: -1 });
    
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Delete user
router.delete('/users/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Don't allow deleting super admin
    const user = await User.findById(userId);
    if (user && user.email === 'madoabogrida05@gmail.com') {
      return res.status(400).json({ message: 'Cannot delete super admin' });
    }
    
    // Delete user's messages
    await Message.deleteMany({ sender: userId });
    
    // Remove user from groups
    await Group.updateMany(
      { 'members.user': userId },
      { $pull: { members: { user: userId } } }
    );
    
    // Delete groups where user is admin
    await Group.deleteMany({ admin: userId });
    
    // Delete user
    await User.findByIdAndDelete(userId);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Get all messages
router.post('/messages', adminAuth, async (req, res) => {
  try {
    const { chatType, limit = 100, page = 1 } = req.query;
    
    let query = {};
    if (chatType) {
      query.chatType = chatType;
    }
    
    const messages = await Message.find(query)
      .populate('sender', 'username displayName')
      .populate('replyTo.sender', 'username displayName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Message.countDocuments(query);
    
    res.json({ 
      messages, 
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total 
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

// Delete all global messages
router.delete('/messages/global', adminAuth, async (req, res) => {
  try {
    const result = await Message.deleteMany({ chatType: 'global' });
    
    res.json({ 
      message: 'All global messages deleted successfully',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Delete global messages error:', error);
    res.status(500).json({ message: 'Failed to delete global messages' });
  }
});

// Delete specific message
router.delete('/messages/:messageId', adminAuth, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findByIdAndDelete(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Failed to delete message' });
  }
});

// Get all groups
router.post('/groups', adminAuth, async (req, res) => {
  try {
    const groups = await Group.find({})
      .populate('admin', 'username displayName')
      .populate('members.user', 'username displayName')
      .sort({ createdAt: -1 });
    
    res.json({ groups });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ message: 'Failed to fetch groups' });
  }
});

// Delete group
router.delete('/groups/:groupId', adminAuth, async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Delete all messages in the group
    await Message.deleteMany({ groupId });
    
    // Delete the group
    await Group.findByIdAndDelete(groupId);
    
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ message: 'Failed to delete group' });
  }
});

// Get system stats
router.post('/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalMessages = await Message.countDocuments();
    const totalGroups = await Group.countDocuments();
    const globalMessages = await Message.countDocuments({ chatType: 'global' });
    const privateMessages = await Message.countDocuments({ chatType: 'private' });
    const groupMessages = await Message.countDocuments({ chatType: 'group' });
    
    // Recent activity
    const recentUsers = await User.find({}, 'username displayName createdAt')
      .sort({ createdAt: -1 })
      .limit(5);
    
    const recentMessages = await Message.find({}, 'content sender createdAt chatType')
      .populate('sender', 'username displayName')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({
      stats: {
        totalUsers,
        totalMessages,
        totalGroups,
        globalMessages,
        privateMessages,
        groupMessages
      },
      recentUsers,
      recentMessages
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

module.exports = router;
