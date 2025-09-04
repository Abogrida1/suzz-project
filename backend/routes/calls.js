const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');

// Start a voice call
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const { recipientId, callType = 'voice' } = req.body;
    const callerId = req.user._id;

    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient ID is required' });
    }

    if (callerId === recipientId) {
      return res.status(400).json({ error: 'Cannot call yourself' });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Create call data
    const callData = {
      id: `call_${Date.now()}_${callerId}`,
      callerId,
      recipientId,
      callerName: req.user.displayName || req.user.username,
      callerAvatar: req.user.avatar,
      recipientName: recipient.displayName || recipient.username,
      recipientAvatar: recipient.avatar,
      callType,
      status: 'initiated',
      startTime: new Date(),
      duration: 0
    };

    // Emit call event to recipient
    req.app.get('io').to(recipientId).emit('incoming_call', callData);

    res.json({
      success: true,
      call: callData,
      message: 'Call initiated successfully'
    });

  } catch (error) {
    console.error('Error starting call:', error);
    res.status(500).json({ error: 'Failed to start call' });
  }
});

// Accept a call
router.post('/accept', authenticateToken, async (req, res) => {
  try {
    const { callId } = req.body;
    const userId = req.user._id;

    // Emit call accepted event
    req.app.get('io').emit('call_accepted', {
      callId,
      acceptedBy: userId,
      acceptedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Call accepted'
    });

  } catch (error) {
    console.error('Error accepting call:', error);
    res.status(500).json({ error: 'Failed to accept call' });
  }
});

// Reject a call
router.post('/reject', authenticateToken, async (req, res) => {
  try {
    const { callId } = req.body;
    const userId = req.user._id;

    // Emit call rejected event
    req.app.get('io').emit('call_rejected', {
      callId,
      rejectedBy: userId,
      rejectedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Call rejected'
    });

  } catch (error) {
    console.error('Error rejecting call:', error);
    res.status(500).json({ error: 'Failed to reject call' });
  }
});

// End a call
router.post('/end', authenticateToken, async (req, res) => {
  try {
    const { callId, duration } = req.body;
    const userId = req.user._id;

    // Emit call ended event
    req.app.get('io').emit('call_ended', {
      callId,
      endedBy: userId,
      endedAt: new Date(),
      duration: duration || 0
    });

    res.json({
      success: true,
      message: 'Call ended'
    });

  } catch (error) {
    console.error('Error ending call:', error);
    res.status(500).json({ error: 'Failed to end call' });
  }
});

// Get call history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    // This would typically come from a calls collection
    // For now, return empty array
    const calls = [];

    res.json({
      success: true,
      calls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: calls.length
      }
    });

  } catch (error) {
    console.error('Error fetching call history:', error);
    res.status(500).json({ error: 'Failed to fetch call history' });
  }
});

module.exports = router;
