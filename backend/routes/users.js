const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const router = express.Router();

// Get all users (for user list)
router.get('/', async (req, res) => {
  try {
    const { search, limit = 50, skip = 0 } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('username displayName avatar status isOnline lastSeen')
      .sort({ isOnline: -1, lastSeen: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Search users (for mobile chat) with smart suggestions
router.get('/search', async (req, res) => {
  try {
    const { q, smart = false } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }
    
    let query = {
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { displayName: { $regex: q, $options: 'i' } }
      ]
    };

    // Smart search with better matching
    if (smart === 'true') {
      // Add exact match priority
      const exactMatchQuery = {
        $or: [
          { username: { $regex: `^${q}`, $options: 'i' } },
          { displayName: { $regex: `^${q}`, $options: 'i' } }
        ]
      };
      
      const partialMatchQuery = {
        $or: [
          { username: { $regex: q, $options: 'i' } },
          { displayName: { $regex: q, $options: 'i' } }
        ]
      };

      // Get exact matches first
      const exactMatches = await User.find(exactMatchQuery)
        .select('username displayName avatar status isOnline lastSeen')
        .limit(10);

      // Get partial matches
      const partialMatches = await User.find({
        ...partialMatchQuery,
        _id: { $nin: exactMatches.map(u => u._id) }
      })
        .select('username displayName avatar status isOnline lastSeen')
        .limit(10);

      // Combine and sort by relevance
      const allUsers = [...exactMatches, ...partialMatches];
      
      // Sort by relevance: exact matches first, then by display name similarity
      allUsers.sort((a, b) => {
        const aUsername = a.username.toLowerCase();
        const bUsername = b.username.toLowerCase();
        const aDisplay = (a.displayName || '').toLowerCase();
        const bDisplay = (b.displayName || '').toLowerCase();
        const queryLower = q.toLowerCase();

        // Exact username match
        const aExactUsername = aUsername.startsWith(queryLower);
        const bExactUsername = bUsername.startsWith(queryLower);
        if (aExactUsername && !bExactUsername) return -1;
        if (!aExactUsername && bExactUsername) return 1;

        // Exact display name match
        const aExactDisplay = aDisplay.startsWith(queryLower);
        const bExactDisplay = bDisplay.startsWith(queryLower);
        if (aExactDisplay && !bExactDisplay) return -1;
        if (!aExactDisplay && bExactDisplay) return 1;

        // Partial matches
        const aUsernameScore = aUsername.includes(queryLower) ? 1 : 0;
        const bUsernameScore = bUsername.includes(queryLower) ? 1 : 0;
        if (aUsernameScore !== bUsernameScore) return bUsernameScore - aUsernameScore;

        const aDisplayScore = aDisplay.includes(queryLower) ? 1 : 0;
        const bDisplayScore = bDisplay.includes(queryLower) ? 1 : 0;
        if (aDisplayScore !== bDisplayScore) return bDisplayScore - aDisplayScore;

        // Online status
        if (a.isOnline !== b.isOnline) return b.isOnline - a.isOnline;

        return 0;
      });

      return res.json(allUsers.slice(0, 20));
    }
    
    // Regular search
    const users = await User.find(query)
      .select('username displayName avatar status isOnline lastSeen')
      .sort({ isOnline: -1, lastSeen: -1 })
      .limit(20);

    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Failed to search users' });
  }
});

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .select('-password -friends -blockedUsers');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: user.getPublicProfile() });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.put('/profile', [
  body('displayName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Display name must be between 1 and 50 characters')
    .trim(),
  body('bio')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Bio must be less than 200 characters')
    .trim(),
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location must be less than 100 characters')
    .trim(),
  body('website')
    .optional()
    .isURL()
    .withMessage('Website must be a valid URL')
    .trim(),
  body('status')
    .optional()
    .isIn(['online', 'offline', 'away', 'busy'])
    .withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { displayName, bio, location, website, status } = req.body;
    const updateData = {};

    if (displayName !== undefined) updateData.displayName = displayName;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (website !== undefined) updateData.website = website;
    if (status !== undefined) updateData.status = status;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({ 
      message: 'Profile updated successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Upload avatar
router.put('/avatar', async (req, res) => {
  try {
    const { avatar } = req.body;
    
    if (!avatar) {
      return res.status(400).json({ message: 'Avatar URL required' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar },
      { new: true }
    );

    res.json({ 
      message: 'Avatar updated successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ message: 'Failed to update avatar' });
  }
});

// Add friend
router.post('/friends/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot add yourself as friend' });
    }

    const friend = await User.findById(userId);
    if (!friend) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = await User.findById(req.user._id);
    
    if (user.friends.includes(userId)) {
      return res.status(400).json({ message: 'User is already a friend' });
    }

    user.friends.push(userId);
    await user.save();

    res.json({ 
      message: 'Friend added successfully',
      friend: friend.getPublicProfile()
    });
  } catch (error) {
    console.error('Add friend error:', error);
    res.status(500).json({ message: 'Failed to add friend' });
  }
});

// Remove friend
router.delete('/friends/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(req.user._id);
    user.friends = user.friends.filter(friendId => friendId.toString() !== userId);
    await user.save();

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ message: 'Failed to remove friend' });
  }
});

// Get friends list
router.get('/friends/list', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('friends', 'username displayName avatar status isOnline lastSeen');
    
    const friends = user.friends.map(friend => friend.getPublicProfile());
    
    res.json({ friends });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ message: 'Failed to fetch friends' });
  }
});

// Block user
router.post('/block/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot block yourself' });
    }

    const user = await User.findById(req.user._id);
    
    if (user.blockedUsers.includes(userId)) {
      return res.status(400).json({ message: 'User is already blocked' });
    }

    // Remove from friends if they are friends
    user.friends = user.friends.filter(friendId => friendId.toString() !== userId);
    user.blockedUsers.push(userId);
    await user.save();

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ message: 'Failed to block user' });
  }
});

// Unblock user
router.delete('/block/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(req.user._id);
    user.blockedUsers = user.blockedUsers.filter(blockedId => blockedId.toString() !== userId);
    await user.save();

    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ message: 'Failed to unblock user' });
  }
});

// Get online users
router.get('/online/list', async (req, res) => {
  try {
    const onlineUsers = await User.find({ isOnline: true })
      .select('username displayName avatar status lastSeen')
      .sort({ lastSeen: -1 });

    res.json({ onlineUsers });
  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({ message: 'Failed to fetch online users' });
  }
});

// Update password
router.put('/password', [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ message: 'Failed to update password' });
  }
});

// Update notifications settings
router.put('/notifications', async (req, res) => {
  try {
    const { messageNotifications, soundNotifications, emailNotifications, pushNotifications } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        'settings.notifications.messageNotifications': messageNotifications,
        'settings.notifications.soundNotifications': soundNotifications,
        'settings.notifications.emailNotifications': emailNotifications,
        'settings.notifications.pushNotifications': pushNotifications
      },
      { new: true }
    );

    res.json({ 
      message: 'Notification settings updated successfully',
      settings: user.settings
    });
  } catch (error) {
    console.error('Update notifications error:', error);
    res.status(500).json({ message: 'Failed to update notification settings' });
  }
});

// Update privacy settings
router.put('/privacy', async (req, res) => {
  try {
    const { showOnlineStatus, showLastSeen, allowDirectMessages, profileVisibility } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        'settings.privacy.showOnlineStatus': showOnlineStatus,
        'settings.privacy.showLastSeen': showLastSeen,
        'settings.privacy.allowDirectMessages': allowDirectMessages,
        'settings.privacy.profileVisibility': profileVisibility
      },
      { new: true }
    );

    res.json({ 
      message: 'Privacy settings updated successfully',
      settings: user.settings
    });
  } catch (error) {
    console.error('Update privacy error:', error);
    res.status(500).json({ message: 'Failed to update privacy settings' });
  }
});

// Update appearance settings
router.put('/appearance', async (req, res) => {
  try {
    const { theme, fontSize, language, compactMode } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        'settings.appearance.theme': theme,
        'settings.appearance.fontSize': fontSize,
        'settings.appearance.language': language,
        'settings.appearance.compactMode': compactMode
      },
      { new: true }
    );

    res.json({ 
      message: 'Appearance settings updated successfully',
      settings: user.settings
    });
  } catch (error) {
    console.error('Update appearance error:', error);
    res.status(500).json({ message: 'Failed to update appearance settings' });
  }
});

module.exports = router;
