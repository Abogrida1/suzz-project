const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get global chat messages
router.get('/global', async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;
    
    const messages = await Message.getChatMessages('global', [], parseInt(limit), parseInt(skip));
    
    res.json({ 
      messages: messages.reverse(),
      hasMore: messages.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Get global messages error:', error);
    res.status(500).json({ message: 'Failed to fetch global messages' });
  }
});

// Get private chat messages
router.get('/private/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, skip = 0 } = req.query;
    
    console.log('Fetching private messages for:', req.user._id, 'with:', userId);
    
    // Check if user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      console.log('Other user not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    const messages = await Message.getChatMessages(
      'private', 
      [req.user._id, userId], 
      parseInt(limit), 
      parseInt(skip)
    );
    
    console.log('Found messages:', messages.length);
    console.log('Messages details:', messages.map(m => ({
      id: m._id,
      sender: m.sender?.username,
      content: m.content,
      createdAt: m.createdAt
    })));
    
    res.json({ 
      messages: messages.reverse(),
      otherUser: otherUser.getPublicProfile(),
      hasMore: messages.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Get private messages error:', error);
    res.status(500).json({ message: 'Failed to fetch private messages' });
  }
});

// Get group chat messages
router.get('/group/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { limit = 50, skip = 0 } = req.query;
    
    console.log(`Getting group messages for group ${groupId}, user ${req.user._id}`);
    
    // Check if group exists and user is member
    const Group = require('../models/Group');
    const group = await Group.findById(groupId);
    if (!group) {
      console.log(`Group ${groupId} not found`);
      return res.status(404).json({ message: 'Group not found' });
    }
    
    console.log(`Group found: ${group.name}, admin: ${group.admin}, members: ${group.members.length}`);
    
    // Check if user is member (including admin)
    if (!group.isMember(req.user._id)) {
      console.log(`User ${req.user._id} is not a member of group ${groupId}`);
      return res.status(403).json({ message: 'Access denied' });
    }
    
    console.log(`User ${req.user._id} is a member of group ${groupId}`);
    
    const messages = await Message.find({
      groupId: groupId,
      deleted: false
    })
    .populate([
      { path: 'sender', select: 'username displayName avatar' },
      { path: 'replyTo.sender', select: 'username displayName avatar' }
    ])
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip));
    
    res.json({ 
      messages: messages.reverse(),
      hasMore: messages.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Get group messages error:', error);
    res.status(500).json({ message: 'Failed to fetch group messages' });
  }
});

// Get message by ID
router.get('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId)
      .populate('sender', 'username displayName avatar')
      .populate('replyTo');
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json({ message });
  } catch (error) {
    console.error('Get message error:', error);
    res.status(500).json({ message: 'Failed to fetch message' });
  }
});

// Edit message
router.put('/:messageId', [
  body('content')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message content must be between 1 and 2000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { messageId } = req.params;
    const { content } = req.body;
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this message' });
    }

    // Check if message is too old to edit (e.g., 15 minutes)
    const editTimeLimit = 15 * 60 * 1000; // 15 minutes in milliseconds
    if (Date.now() - message.createdAt.getTime() > editTimeLimit) {
      return res.status(400).json({ message: 'Message is too old to edit' });
    }

    message.content = content;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    await message.populate('sender', 'username displayName avatar');

    res.json({ 
      message: 'Message updated successfully',
      message
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ message: 'Failed to edit message' });
  }
});

// Delete message
router.delete('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    // Soft delete
    message.deleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Failed to delete message' });
  }
});

// Mark messages as read
router.post('/read', async (req, res) => {
  try {
    const { messageIds, chatType, otherUserId } = req.body;
    
    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({ message: 'Message IDs array required' });
    }

    const messages = await Message.find({
      _id: { $in: messageIds },
      deleted: false
    });

    // Mark each message as read
    for (const message of messages) {
      await message.markAsRead(req.user._id);
    }

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages read error:', error);
    res.status(500).json({ message: 'Failed to mark messages as read' });
  }
});

// Get unread message count
router.get('/unread/count', async (req, res) => {
  try {
    const { chatType, otherUserId } = req.query;
    
    let query = {
      recipients: req.user._id,
      deleted: false,
      'readBy.user': { $ne: req.user._id }
    };

    if (chatType === 'private' && otherUserId) {
      query.$or = [
        { privateChatWith: otherUserId, sender: req.user._id },
        { privateChatWith: req.user._id, sender: otherUserId }
      ];
    } else if (chatType === 'global') {
      query.chatType = 'global';
      query.sender = { $ne: req.user._id };
    }

    const count = await Message.countDocuments(query);
    
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Failed to get unread count' });
  }
});

// Get recent conversations
router.get('/conversations/recent', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    // Get user ID from authenticated user
    const userId = req.user._id;
    
    // Get recent private conversations
    const privateMessages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userId, chatType: 'private' },
            { privateChatWith: userId, chatType: 'private' }
          ],
          deleted: false
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userId] },
              '$privateChatWith',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$sender', userId] },
                    { $not: { $in: [userId, '$readBy.user'] } }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          user: {
            _id: '$user._id',
            username: '$user.username',
            displayName: '$user.displayName',
            avatar: '$user.avatar',
            isOnline: '$user.isOnline',
            lastSeen: '$user.lastSeen'
          },
          lastMessage: {
            _id: '$lastMessage._id',
            content: '$lastMessage.content',
            type: '$lastMessage.type',
            createdAt: '$lastMessage.createdAt',
            status: '$lastMessage.status'
          },
          unreadCount: 1
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    res.json({ conversations: privateMessages });
  } catch (error) {
    console.error('Get recent conversations error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      userId: req.query.userId
    });
    res.status(500).json({ 
      message: 'Failed to fetch recent conversations',
      error: error.message 
    });
  }
});

// Mark messages as read
router.post('/read', async (req, res) => {
  try {
    const { messageIds, chatType, otherUserId } = req.body;
    
    console.log('Mark messages as read request:', {
      messageIds,
      chatType,
      otherUserId,
      userId: req.user?._id
    });

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ message: 'Message IDs are required' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Update messages to mark them as read
    const updateResult = await Message.updateMany(
      { 
        _id: { $in: messageIds },
        sender: { $ne: req.user._id } // Don't mark own messages as read
      },
      { 
        $addToSet: { 
          readBy: { 
            user: req.user._id, 
            readAt: new Date() 
          } 
        } 
      }
    );

    console.log('Messages marked as read:', updateResult);

    res.json({ 
      message: 'Messages marked as read successfully',
      modifiedCount: updateResult.modifiedCount
    });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ 
      message: 'Failed to mark messages as read',
      error: error.message 
    });
  }
});

// Get messages for a specific conversation
router.get('/conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, skip = 0 } = req.query;
    const userId = req.user._id;
    
    console.log('Fetching messages for conversation:', conversationId, 'user:', userId);
    
    // Try to find as private conversation first
    const privateMessages = await Message.find({
      $or: [
        { privateChatWith: new mongoose.Types.ObjectId(userId), sender: new mongoose.Types.ObjectId(conversationId) },
        { privateChatWith: new mongoose.Types.ObjectId(conversationId), sender: new mongoose.Types.ObjectId(userId) }
      ]
    })
    .populate('sender', 'username displayName avatar')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip));
    
    if (privateMessages.length > 0) {
      return res.json(privateMessages.reverse());
    }
    
    // Try to find as group conversation
    const group = await Group.findById(conversationId);
    if (group && group.members.includes(userId)) {
      const groupMessages = await Message.find({
        groupId: new mongoose.Types.ObjectId(conversationId)
      })
      .populate('sender', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));
      
      return res.json(groupMessages.reverse());
    }
    
    res.status(404).json({ message: 'Conversation not found' });
  } catch (error) {
    console.error('Get conversation messages error:', error);
    res.status(500).json({ message: 'Failed to fetch conversation messages' });
  }
});

module.exports = router;
