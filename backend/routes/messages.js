const express = require('express');
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const User = require('../models/User');

const router = express.Router();

// Get global chat messages
router.get('/global', async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;
    
    const messages = await Message.getChatMessages('global', [], parseInt(limit), parseInt(skip));
    
    res.json({ messages: messages.reverse() });
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
    
    // Check if user exists
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const messages = await Message.getChatMessages(
      'private', 
      [req.user._id, userId], 
      parseInt(limit), 
      parseInt(skip)
    );
    
    res.json({ 
      messages: messages.reverse(),
      otherUser: otherUser.getPublicProfile()
    });
  } catch (error) {
    console.error('Get private messages error:', error);
    res.status(500).json({ message: 'Failed to fetch private messages' });
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
    
    // Get recent private conversations
    const privateMessages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.user._id, chatType: 'private' },
            { privateChatWith: req.user._id, chatType: 'private' }
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
              { $eq: ['$sender', req.user._id] },
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
                    { $ne: ['$sender', req.user._id] },
                    { $not: { $in: [req.user._id, '$readBy.user'] } }
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
    res.status(500).json({ message: 'Failed to fetch recent conversations' });
  }
});

module.exports = router;
