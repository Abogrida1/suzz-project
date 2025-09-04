const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const Message = require('../models/Message');

// Configure multer for audio files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/voice-messages';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `voice-${req.user._id}-${uniqueSuffix}.webm`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'), false);
    }
  }
});

// Upload voice message
router.post('/upload', authenticateToken, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { conversationId, duration, replyTo } = req.body;
    const senderId = req.user._id;

    if (!conversationId) {
      // Delete uploaded file if no conversation ID
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Conversation ID is required' });
    }

    // Create voice message
    const voiceMessage = new Message({
      content: 'Voice message',
      type: 'voice',
      sender: senderId,
      conversationId,
      audioUrl: `/uploads/voice-messages/${req.file.filename}`,
      duration: parseInt(duration) || 0,
      replyTo: replyTo || null,
      timestamp: new Date()
    });

    await voiceMessage.save();

    // Emit voice message to conversation participants
    req.app.get('io').to(conversationId).emit('voice_message', {
      id: voiceMessage._id,
      content: voiceMessage.content,
      type: voiceMessage.type,
      sender: {
        id: senderId,
        name: req.user.displayName || req.user.username,
        avatar: req.user.avatar
      },
      audioUrl: voiceMessage.audioUrl,
      duration: voiceMessage.duration,
      replyTo: voiceMessage.replyTo,
      timestamp: voiceMessage.timestamp
    });

    res.json({
      success: true,
      message: voiceMessage,
      audioUrl: voiceMessage.audioUrl
    });

  } catch (error) {
    console.error('Error uploading voice message:', error);
    
    // Delete uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Failed to upload voice message' });
  }
});

// Get voice message
router.get('/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Voice message not found' });
    }

    // Check if user has access to this message
    // This would typically involve checking conversation membership
    // For now, we'll allow access if the user is the sender
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      success: true,
      message: {
        id: message._id,
        content: message.content,
        type: message.type,
        audioUrl: message.audioUrl,
        duration: message.duration,
        timestamp: message.timestamp
      }
    });

  } catch (error) {
    console.error('Error fetching voice message:', error);
    res.status(500).json({ error: 'Failed to fetch voice message' });
  }
});

// Delete voice message
router.delete('/:messageId', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Voice message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete audio file
    if (message.audioUrl) {
      const filePath = path.join(__dirname, '..', message.audioUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete message from database
    await Message.findByIdAndDelete(messageId);

    // Emit deletion event
    req.app.get('io').to(message.conversationId).emit('voice_message_deleted', {
      messageId,
      deletedBy: userId
    });

    res.json({
      success: true,
      message: 'Voice message deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting voice message:', error);
    res.status(500).json({ error: 'Failed to delete voice message' });
  }
});

// Get voice messages for a conversation
router.get('/conversation/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({
      conversationId,
      type: 'voice'
    })
    .sort({ timestamp: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('sender', 'username displayName avatar');

    res.json({
      success: true,
      messages: messages.map(msg => ({
        id: msg._id,
        content: msg.content,
        type: msg.type,
        sender: {
          id: msg.sender._id,
          name: msg.sender.displayName || msg.sender.username,
          avatar: msg.sender.avatar
        },
        audioUrl: msg.audioUrl,
        duration: msg.duration,
        replyTo: msg.replyTo,
        timestamp: msg.timestamp
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await Message.countDocuments({ conversationId, type: 'voice' })
      }
    });

  } catch (error) {
    console.error('Error fetching voice messages:', error);
    res.status(500).json({ error: 'Failed to fetch voice messages' });
  }
});

module.exports = router;
