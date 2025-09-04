const express = require('express');
const mongoose = require('mongoose');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const Message = require('../models/Message');
const Group = require('../models/Group');

const router = express.Router();

// Get private conversations
router.get('/private', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('Fetching private conversations for user:', userId);
    
    // Get all private messages for this user
    const messages = await Message.find({
      $or: [
        { sender: userId, chatType: 'private' },
        { privateChatWith: userId, chatType: 'private' }
      ]
    })
    .populate('sender', 'username displayName avatar')
    .populate('privateChatWith', 'username displayName avatar')
    .sort({ createdAt: -1 });

    console.log('Found messages:', messages.length);
    console.log('Messages details:', messages.map(m => ({
      id: m._id,
      sender: m.sender?.username,
      privateChatWith: m.privateChatWith?.username,
      content: m.content?.substring(0, 50)
    })));

    // Group messages by conversation partner
    const conversations = new Map();
    
    messages.forEach(message => {
      let partnerId, partner;
      
      if (message.sender._id.toString() === userId) {
        // User is sender, partner is privateChatWith
        if (message.privateChatWith) {
          partnerId = message.privateChatWith._id.toString();
          partner = message.privateChatWith;
        } else {
          return; // Skip if no privateChatWith
        }
      } else {
        // User is privateChatWith, partner is sender
        partnerId = message.sender._id.toString();
        partner = message.sender;
      }
      
      if (!conversations.has(partnerId)) {
        conversations.set(partnerId, {
          _id: `private_${partnerId}`,
          otherUser: partner,
          lastMessage: null,
          unreadCount: 0
        });
      }
      
      const conversation = conversations.get(partnerId);
      if (!conversation.lastMessage || message.createdAt > conversation.lastMessage.createdAt) {
        conversation.lastMessage = {
          content: message.content,
          createdAt: message.createdAt,
          sender: message.sender
        };
      }
      
      // Count unread messages (messages not sent by user and not read)
      if (message.sender._id.toString() !== userId && !message.readBy?.some(read => read.user.toString() === userId)) {
        conversation.unreadCount++;
      }
    });
    
    const conversationsList = Array.from(conversations.values());
    console.log('Returning conversations:', conversationsList.length);
    
    res.json(conversationsList);
  } catch (error) {
    console.error('Error fetching private conversations:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ 
      message: 'Error fetching conversations',
      error: error.message 
    });
  }
});

// Get group conversations
router.get('/groups', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('Fetching group conversations for user:', userId);
    
    // Get groups where user is a member
    const groups = await Group.find({
      members: new mongoose.Types.ObjectId(userId)
    })
    .populate('members', 'username displayName avatar')
    .sort({ updatedAt: -1 });

    console.log('Found groups:', groups.length);

    // Get last message for each group
    const groupsWithMessages = await Promise.all(
      groups.map(async (group) => {
        const lastMessage = await Message.findOne({
          chatType: 'group',
          groupId: group._id
        })
        .populate('sender', 'username displayName avatar')
        .sort({ createdAt: -1 });

        // Count unread messages
        const unreadCount = await Message.countDocuments({
          chatType: 'group',
          groupId: group._id,
          sender: { $ne: userId },
          readBy: { $nin: [{ user: userId }] }
        });

        return {
          _id: group._id,
          name: group.name,
          description: group.description,
          avatar: group.avatar,
          members: group.members,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            sender: lastMessage.sender
          } : null,
          unreadCount
        };
      })
    );
    
    console.log('Returning groups:', groupsWithMessages.length);
    res.json(groupsWithMessages);
  } catch (error) {
    console.error('Error fetching group conversations:', error);
    res.status(500).json({ message: 'Error fetching group conversations' });
  }
});

// Create new private conversation
router.post('/private', authenticateToken, async (req, res) => {
  try {
    const { otherUserId } = req.body;
    const userId = req.user._id;

    if (!otherUserId) {
      return res.status(400).json({ message: 'Other user ID is required' });
    }

    if (otherUserId === userId) {
      return res.status(400).json({ message: 'Cannot create conversation with yourself' });
    }

    // Check if other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if conversation already exists
    const existingMessages = await Message.find({
      $or: [
        { sender: userId, recipients: otherUserId, chatType: 'private' },
        { sender: otherUserId, recipients: userId, chatType: 'private' }
      ]
    });

    if (existingMessages.length > 0) {
      return res.json({
        _id: `private_${otherUserId}`,
        otherUser: {
          _id: otherUser._id,
          username: otherUser.username,
          displayName: otherUser.displayName,
          avatar: otherUser.avatar
        },
        lastMessage: null,
        unreadCount: 0
      });
    }

    // Create new conversation (just return the structure, no actual message needed)
    res.json({
      _id: `private_${otherUserId}`,
      otherUser: {
        _id: otherUser._id,
        username: otherUser.username,
        displayName: otherUser.displayName,
        avatar: otherUser.avatar
      },
      lastMessage: null,
      unreadCount: 0
    });
  } catch (error) {
    console.error('Error creating private conversation:', error);
    res.status(500).json({ message: 'Error creating conversation' });
  }
});

// Get specific conversation
router.get('/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    
    console.log('Fetching conversation:', conversationId, 'for user:', userId);
    
    // Try to find as private conversation first
    const privateMessages = await Message.find({
      $or: [
        { privateChatWith: new mongoose.Types.ObjectId(userId), sender: new mongoose.Types.ObjectId(conversationId) },
        { privateChatWith: new mongoose.Types.ObjectId(conversationId), sender: new mongoose.Types.ObjectId(userId) }
      ]
    }).populate('sender', 'username displayName avatar').limit(1);
    
    if (privateMessages.length > 0) {
      // It's a private conversation
      const otherUser = await User.findById(conversationId).select('username displayName avatar status');
      if (!otherUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      return res.json({
        id: conversationId,
        type: 'private',
        name: otherUser.displayName || otherUser.username,
        avatar: otherUser.avatar || `https://ui-avatars.com/api/?name=${otherUser.username}&background=3b82f6&color=fff`,
        status: otherUser.status || 'Available',
        isOnline: false // You can implement online status here
      });
    }
    
    // Try to find as group conversation
    const group = await Group.findById(conversationId).populate('members', 'username displayName avatar');
    if (group) {
      return res.json({
        id: group._id,
        type: 'group',
        name: group.name,
        avatar: group.avatar || `https://ui-avatars.com/api/?name=${group.name}&background=6366f1&color=fff`,
        status: 'Group chat',
        isOnline: false,
        members: group.members.length
      });
    }
    
    res.status(404).json({ message: 'Conversation not found' });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ message: 'Error fetching conversation' });
  }
});

module.exports = router;
