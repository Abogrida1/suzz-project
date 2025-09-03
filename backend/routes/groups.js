const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const User = require('../models/User');
const Message = require('../models/Message');
const { authenticateToken } = require('../middleware/auth');

// Create a new group
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, memberIds = [] } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    // Create group
    const group = new Group({
      name: name.trim(),
      description: description?.trim(),
      admin: req.user._id,
      members: [
        {
          user: req.user._id,
          role: 'admin',
          joinedAt: new Date()
        }
      ]
    });

    // Add members if provided
    if (memberIds.length > 0) {
      const validUsers = await User.find({
        _id: { $in: memberIds },
        _id: { $ne: req.user._id } // Don't add admin again
      });

      validUsers.forEach(user => {
        group.addMember(user._id, 'member');
      });
    }

    await group.save();

    // Populate the group data
    await group.populate([
      { path: 'admin', select: 'username displayName avatar' },
      { path: 'members.user', select: 'username displayName avatar' }
    ]);

    res.status(201).json({
      message: 'Group created successfully',
      group
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ message: 'Failed to create group' });
  }
});

// Get user's groups
router.get('/my-groups', authenticateToken, async (req, res) => {
  try {
    const groups = await Group.find({
      $or: [
        { admin: req.user._id },
        { 'members.user': req.user._id }
      ]
    })
    .populate('admin', 'username displayName avatar')
    .populate('members.user', 'username displayName avatar')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    console.log(`Found ${groups.length} groups for user ${req.user._id}`);
    groups.forEach(group => {
      console.log(`Group: ${group.name}, Admin: ${group.admin.username}, Members: ${group.members.length}`);
    });

    // Filter groups to only include those where user is actually a member
    const userGroups = groups.filter(group => {
      // Check if user is admin
      if (group.admin._id.toString() === req.user._id.toString()) {
        console.log(`User ${req.user._id} is admin of group ${group.name}`);
        return true;
      }
      // Check if user is in members list
      const isMember = group.members.some(member => 
        member.user._id.toString() === req.user._id.toString()
      );
      
      if (isMember) {
        console.log(`User ${req.user._id} is member of group ${group.name}`);
      } else {
        console.log(`User ${req.user._id} is NOT member of group ${group.name} - filtering out`);
      }
      
      return isMember;
    });

    // Add member count to each group (including admin)
    const groupsWithCount = userGroups.map(group => {
      // Check if admin is already in members list
      const adminInMembers = group.members.some(member => 
        member.user._id.toString() === group.admin._id.toString()
      );
      
      const memberCount = adminInMembers ? group.members.length : group.members.length + 1;
      console.log(`Group ${group.name}: ${group.members.length} members, admin in members: ${adminInMembers}, total: ${memberCount}`);
      return {
        ...group.toObject(),
        memberCount: memberCount
      };
    });

    res.json({ groups: groupsWithCount });
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ message: 'Failed to fetch groups' });
  }
});

// Get group details
router.get('/:groupId', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('admin', 'username displayName avatar')
      .populate('members.user', 'username displayName avatar')
      .populate('lastMessage');

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is member
    if (!group.isMember(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ group });
  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({ message: 'Failed to fetch group' });
  }
});

// Add member to group
router.post('/:groupId/members', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user can invite (admin, moderator, or member with permission)
    if (!group.canMemberInvite(req.user._id)) {
      return res.status(403).json({ message: 'You do not have permission to invite members' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already a member (including admin)
    if (group.isMember(userId)) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    group.addMember(userId, 'member');
    await group.save();

    await group.populate('members.user', 'username displayName avatar');

    res.json({
      message: 'Member added successfully',
      group
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Failed to add member' });
  }
});

// Remove member from group
router.delete('/:groupId/members/:userId', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is admin or moderator
    if (!group.isModerator(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Can't remove admin
    if (group.admin.toString() === req.params.userId) {
      return res.status(400).json({ message: 'Cannot remove group admin' });
    }

    group.removeMember(req.params.userId);
    await group.save();

    res.json({
      message: 'Member removed successfully',
      group
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Failed to remove member' });
  }
});

// Update member role
router.put('/:groupId/members/:userId/role', authenticateToken, async (req, res) => {
  try {
    const { role } = req.body;
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only admin can change roles
    if (!group.isAdmin(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Can't change admin role
    if (group.admin.toString() === req.params.userId) {
      return res.status(400).json({ message: 'Cannot change admin role' });
    }

    group.updateMemberRole(req.params.userId, role);
    await group.save();

    res.json({
      message: 'Member role updated successfully',
      group
    });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({ message: 'Failed to update member role' });
  }
});

// Leave group
router.post('/:groupId/leave', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user can leave group
    if (!group.canMemberLeave(req.user._id)) {
      return res.status(403).json({ message: 'You do not have permission to leave this group' });
    }

    // Can't leave if you're the admin
    if (group.admin.toString() === req.user._id) {
      return res.status(400).json({ message: 'Admin cannot leave group. Transfer admin role first.' });
    }

    group.removeMember(req.user._id);
    await group.save();

    res.json({
      message: 'Left group successfully'
    });
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ message: 'Failed to leave group' });
  }
});

// Update group settings
router.put('/:groupId/settings', authenticateToken, async (req, res) => {
  try {
    const { name, description, settings } = req.body;
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only admin can update settings
    if (!group.isAdmin(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description?.trim();
    if (settings) {
      Object.assign(group.settings, settings);
    }

    await group.save();

    res.json({
      message: 'Group settings updated successfully',
      group
    });
  } catch (error) {
    console.error('Update group settings error:', error);
    res.status(500).json({ message: 'Failed to update group settings' });
  }
});

// Update member permissions
router.put('/:groupId/member-permissions', authenticateToken, async (req, res) => {
  try {
    const { memberPermissions } = req.body;
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only admin can update member permissions
    if (!group.isAdmin(req.user._id)) {
      return res.status(403).json({ message: 'Only admin can update member permissions' });
    }

    if (memberPermissions) {
      group.settings.memberPermissions = {
        ...group.settings.memberPermissions,
        ...memberPermissions
      };
    }

    await group.save();

    res.json({
      message: 'Member permissions updated successfully',
      group
    });
  } catch (error) {
    console.error('Update member permissions error:', error);
    res.status(500).json({ message: 'Failed to update member permissions' });
  }
});

// Delete group
router.delete('/:groupId', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Only admin can delete group
    if (!group.isAdmin(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete all messages in the group
    await Message.deleteMany({ groupId: group._id });

    // Delete the group
    await Group.findByIdAndDelete(req.params.groupId);

    res.json({
      message: 'Group deleted successfully'
    });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ message: 'Failed to delete group' });
  }
});

// Get group members
router.get('/:groupId/members', authenticateToken, async (req, res) => {
  try {
    const groupId = req.params.groupId;
    console.log(`Getting members for group ${groupId}, user ${req.user._id}`);
    
    const group = await Group.findById(groupId)
      .populate('members.user', 'username displayName avatar')
      .populate('admin', 'username displayName avatar');

    if (!group) {
      console.log(`Group ${groupId} not found`);
      return res.status(404).json({ message: 'Group not found' });
    }

    console.log(`Group found: ${group.name}, admin: ${group.admin._id}, members: ${group.members.length}`);
    console.log(`Checking membership for user: ${req.user._id}`);
    console.log(`Admin ID: ${group.admin._id}`);
    console.log(`Admin type: ${typeof group.admin._id}`);
    console.log(`User ID type: ${typeof req.user._id}`);

    // Check if user is member or admin
    const isMember = group.isMember(req.user._id);
    console.log(`isMember result: ${isMember}`);
    
    if (!isMember) {
      console.log(`User ${req.user._id} is not a member of group ${groupId}`);
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Check if user can view members
    if (!group.canMemberViewMembers(req.user._id)) {
      console.log(`User ${req.user._id} cannot view members of group ${groupId}`);
      return res.status(403).json({ message: 'You do not have permission to view group members' });
    }
    
    console.log(`User ${req.user._id} is a member of group ${groupId} and can view members`);

    // Create members list with admin included
    const members = [...group.members];
    console.log(`Original members count: ${members.length}`);
    
    // Check if admin is already in members list
    const adminInMembers = members.some(member => 
      member.user._id.toString() === group.admin._id.toString()
    );
    
    console.log(`Admin already in members list: ${adminInMembers}`);
    
    if (!adminInMembers) {
      // Add admin to members list
      const adminMember = {
        _id: group.admin._id,
        user: group.admin,
        role: 'admin',
        joinedAt: group.createdAt
      };
      members.unshift(adminMember);
      console.log(`Added admin to members list. New count: ${members.length}`);
    } else {
      // Update admin role in members list
      const adminIndex = members.findIndex(member => 
        member.user._id.toString() === group.admin._id.toString()
      );
      if (adminIndex !== -1) {
        members[adminIndex].role = 'admin';
        console.log(`Updated admin role in members list at index ${adminIndex}`);
      }
    }

    console.log(`Final members count: ${members.length}`);
    res.json({ members });
  } catch (error) {
    console.error('Get group members error:', error);
    res.status(500).json({ message: 'Failed to fetch group members' });
  }
});

// Update group
router.put('/:groupId', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is admin
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can update group' });
    }

    const { name, description, isPrivate, allowInvites, muteNotifications } = req.body;

    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (isPrivate !== undefined) group.isPrivate = isPrivate;
    if (allowInvites !== undefined) group.allowInvites = allowInvites;
    if (muteNotifications !== undefined) group.muteNotifications = muteNotifications;

    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate('admin', 'username displayName avatar')
      .populate('members.user', 'username displayName avatar')
      .populate('lastMessage');

    res.json({ group: updatedGroup });
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ message: 'Failed to update group' });
  }
});

// Update member role
router.put('/:groupId/members/:memberId', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is admin
    if (group.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can change member roles' });
    }

    const { role } = req.body;

    if (!['member', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Find and update member
    const member = group.members.find(member => 
      member._id.toString() === req.params.memberId
    );

    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    member.role = role;
    await group.save();

    const updatedGroup = await Group.findById(group._id)
      .populate('admin', 'username displayName avatar')
      .populate('members.user', 'username displayName avatar')
      .populate('lastMessage');

    res.json({ group: updatedGroup });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({ message: 'Failed to update member role' });
  }
});

// Search users for adding to group
router.get('/search-users', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ users: [] });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } }, // Exclude current user
        {
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { displayName: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
    .select('username displayName avatar email')
    .limit(10);

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Failed to search users' });
  }
});

module.exports = router;
