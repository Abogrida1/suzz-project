const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Group = require('../models/Group');

const setupSocketHandlers = (io) => {
  // Middleware for socket authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    try {
      console.log(`User ${socket.user.username} connected with socket ${socket.id}`);

      // Update user's socket ID and online status
      await User.findByIdAndUpdate(socket.userId, {
        socketId: socket.id,
        isOnline: true,
        lastSeen: new Date()
      });
    } catch (error) {
      console.error('Connection error:', error);
      socket.disconnect();
      return;
    }

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Notify others that user is online
    socket.broadcast.emit('user_online', {
      userId: socket.userId,
      user: socket.user.getPublicProfile()
    });

    // Mark all pending messages as delivered when user comes online
    try {
      const pendingMessages = await Message.find({
        'deliveryStatus.user': socket.userId,
        'deliveryStatus.status': { $ne: 'delivered' }
      });

      for (const message of pendingMessages) {
        const existingStatus = message.deliveryStatus.find(ds => ds.user.toString() === socket.userId.toString());
        if (existingStatus) {
          existingStatus.status = 'delivered';
          existingStatus.timestamp = new Date();
        } else {
          message.deliveryStatus.push({
            user: socket.userId,
            status: 'delivered',
            timestamp: new Date()
          });
        }
        await message.save();

        // Notify sender about delivery
        const senderSocket = await findUserSocket(message.sender);
        if (senderSocket) {
          senderSocket.emit('message_delivery_update', {
            messageId: message._id,
            status: 'delivered',
            recipientId: socket.userId
          });
        }
      }
    } catch (error) {
      console.error('Error marking messages as delivered:', error);
    }

    // Handle joining global chat
    socket.on('join_global', async () => {
      socket.join('global_chat');
      console.log(`User ${socket.user.username} joined global chat`);
      
      // Send recent global messages
      const messages = await Message.getChatMessages('global', [], 50);
      socket.emit('global_messages', messages.reverse());
    });

    // Handle leaving global chat
    socket.on('leave_global', () => {
      socket.leave('global_chat');
      console.log(`User ${socket.user.username} left global chat`);
    });

    // Handle joining private chat
    socket.on('join_private', async (data) => {
      const { otherUserId } = data;
      
      if (!otherUserId) {
        return socket.emit('error', { message: 'Other user ID required' });
      }

      const otherUser = await User.findById(otherUserId);
      if (!otherUser) {
        return socket.emit('error', { message: 'User not found' });
      }

      // Create room name for private chat (consistent ordering)
      const roomName = [socket.userId, otherUserId].sort().join('_');
      socket.join(`private_${roomName}`);
      
      console.log(`User ${socket.user.username} joined private chat with ${otherUser.username}`);
      
      // Send recent private messages
      const messages = await Message.getChatMessages('private', [socket.userId, otherUserId], 50);
      socket.emit('private_messages', {
        otherUserId,
        messages: messages.reverse()
      });
    });

    // Handle leaving private chat
    socket.on('leave_private', (data) => {
      const { otherUserId } = data;
      const roomName = [socket.userId, otherUserId].sort().join('_');
      socket.leave(`private_${roomName}`);
      console.log(`User ${socket.user.username} left private chat with ${otherUserId}`);
    });

    // Handle joining group chat
    socket.on('join_group', async (data) => {
      try {
        const { groupId } = data;
        
        if (!groupId) {
          return socket.emit('error', { message: 'Group ID required' });
        }

        // Check if user is member of the group
        const group = await Group.findById(groupId);
        if (!group) {
          return socket.emit('error', { message: 'Group not found' });
        }

        // Check if user is member (including admin)
        if (!group.isMember(socket.userId)) {
          return socket.emit('error', { message: 'You are not a member of this group' });
        }

        // Leave any existing group chats
        socket.rooms.forEach(room => {
          if (room.startsWith('group_')) {
            socket.leave(room);
          }
        });

        // Join the group chat room
        socket.join(`group_${groupId}`);
        
        console.log(`User ${socket.user.username} joined group chat ${groupId}`);
        
        // Send recent group messages
        const messages = await Message.find({
          groupId: groupId,
          deleted: false
        })
        .populate([
          { path: 'sender', select: 'username displayName avatar' },
          { path: 'replyTo.sender', select: 'username displayName avatar' }
        ])
        .sort({ createdAt: -1 })
        .limit(50);

        socket.emit('group_messages', {
          groupId,
          messages: messages.reverse()
        });
      } catch (error) {
        console.error('Join group chat error:', error);
        socket.emit('error', { message: 'Failed to join group chat' });
      }
    });

    // Handle leaving group chat
    socket.on('leave_group', (data) => {
      const { groupId } = data;
      
      if (groupId) {
        socket.leave(`group_${groupId}`);
        console.log(`User ${socket.user.username} left group chat ${groupId}`);
      }
    });

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        console.log('Received message from user:', socket.user.username, 'data:', data);
        const { content, type = 'text', chatType, recipients, attachment, replyTo } = data;

        if (!content && !attachment) {
          console.log('No content or attachment provided');
          return socket.emit('error', { message: 'Message content required' });
        }

        if (!chatType) {
          console.log('No chat type provided');
          return socket.emit('error', { message: 'Chat type required' });
        }

        // Prevent sending messages to yourself in private chat
        if (chatType === 'private' && recipients && recipients.includes(socket.userId)) {
          return socket.emit('error', { message: 'Cannot send message to yourself' });
        }

        const messageData = {
          sender: socket.userId,
          content,
          type,
          chatType,
          recipients: recipients || [],
          attachment,
          status: 'sending',
          deliveryStatus: []
        };

        // Handle reply to message
        if (replyTo) {
          const replyMessage = await Message.findById(replyTo);
          if (replyMessage) {
            messageData.replyTo = {
              message: replyTo,
              content: replyMessage.content,
              sender: replyMessage.sender
            };
          }
        }

        // Handle different chat types
        if (chatType === 'global') {
          messageData.recipients = []; // Global chat doesn't need specific recipients
        } else if (chatType === 'private' && recipients && recipients.length === 1) {
          messageData.privateChatWith = recipients[0];
        } else if (chatType === 'group' && recipients && recipients.length > 0) {
          const groupId = recipients[0];
          
          // Check if user is member of the group
          const group = await Group.findById(groupId);
          if (!group) {
            return socket.emit('error', { message: 'Group not found' });
          }
          
          if (!group.isMember(socket.userId)) {
            return socket.emit('error', { message: 'You are not a member of this group' });
          }
          
          messageData.groupId = groupId;
          messageData.recipients = recipients.slice(1); // Rest are actual recipients
        }

        const message = new Message(messageData);
        await message.save();
        console.log('Message saved to database:', message._id, 'status:', message.status);

        // Set delivery status for recipients
        if (chatType === 'private' && recipients && recipients.length === 1) {
          message.deliveryStatus.push({
            user: recipients[0],
            status: 'sent'
          });
        } else if (chatType === 'group' && recipients && recipients.length > 0) {
          const group = await Group.findById(recipients[0]);
          if (group && group.members && Array.isArray(group.members)) {
            group.members.forEach(member => {
              if (member.user && member.user.toString() !== socket.userId) {
                message.deliveryStatus.push({
                  user: member.user,
                  status: 'sent'
                });
              }
            });
          }
        }

        await message.save();

        // Populate sender info in one call for better performance
        await message.populate([
          { path: 'sender', select: 'username displayName avatar' },
          { path: 'replyTo.sender', select: 'username displayName avatar' }
        ]);
        console.log('Message populated:', message._id, 'sender:', message.sender?.username);

        // Emit to appropriate room (excluding sender)
        if (chatType === 'global') {
          socket.to('global_chat').emit('message_received', message);
        } else if (chatType === 'private') {
          const roomName = [socket.userId, recipients[0]].sort().join('_');
          socket.to(`private_${roomName}`).emit('message_received', message);
          
          // Notify recipient if they're not in the chat
          const recipientSocket = await findUserSocket(recipients[0]);
          if (recipientSocket && !recipientSocket.rooms.has(`private_${roomName}`)) {
            recipientSocket.emit('new_private_message', {
              message,
              sender: socket.user.getPublicProfile()
            });
          }
        } else if (chatType === 'group') {
          const groupId = recipients[0];
          socket.to(`group_${groupId}`).emit('message_received', message);
          
          // Notify group members who are not in the chat
          const group = await Group.findById(groupId).populate('members.user');
          if (group) {
            group.members.forEach(async (member) => {
              if (member.user._id.toString() !== socket.userId) {
                const memberSocket = await findUserSocket(member.user._id);
                if (memberSocket && !memberSocket.rooms.has(`group_${groupId}`)) {
                  memberSocket.emit('new_group_message', {
                    message,
                    sender: socket.user.getPublicProfile(),
                    group: {
                      _id: group._id,
                      name: group.name
                    }
                  });
                }
              }
            });
          }
        }

        // Update message status to delivered for online recipients
        let roomName = '';
        if (chatType === 'private' && recipients) {
          roomName = [socket.userId, recipients[0]].sort().join('_');
          const recipientSocket = await findUserSocket(recipients[0]);
          
          if (recipientSocket && recipientSocket.rooms.has(`private_${roomName}`)) {
            message.status = 'delivered';
            await message.save();
          }
        }

        console.log('Message sent successfully:', message._id, 'to room:', chatType === 'global' ? 'global_chat' : chatType === 'private' ? `private_${roomName}` : `group_${recipients[0]}`);
        
        // Send message_sent event to sender only (with tempId for tracking)
        console.log('About to send message_sent event to sender:', socket.user.username, 'message ID:', message._id, 'tempId:', tempId);
        socket.emit('message_sent', { 
          ...message.toObject(), 
          tempId: tempId // Include tempId for frontend tracking
        });
        console.log('Sent message_sent event to sender:', socket.user.username, 'message ID:', message._id);

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { 
          message: 'Failed to send message',
          error: error.message 
        });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { chatType, recipients } = data;
      
      if (chatType === 'global') {
        socket.to('global_chat').emit('user_typing', {
          userId: socket.userId,
          username: socket.user.username,
          displayName: socket.user.displayName
        });
      } else if (chatType === 'private' && recipients && recipients.length === 1) {
        const roomName = [socket.userId, recipients[0]].sort().join('_');
        socket.to(`private_${roomName}`).emit('user_typing', {
          userId: socket.userId,
          username: socket.user.username,
          displayName: socket.user.displayName
        });
      }
    });

    socket.on('typing_stop', (data) => {
      const { chatType, recipients } = data;
      
      if (chatType === 'global') {
        socket.to('global_chat').emit('user_stopped_typing', {
          userId: socket.userId
        });
      } else if (chatType === 'private' && recipients && recipients.length === 1) {
        const roomName = [socket.userId, recipients[0]].sort().join('_');
        socket.to(`private_${roomName}`).emit('user_stopped_typing', {
          userId: socket.userId
        });
      }
    });

    // Handle message delivery status
    socket.on('message_delivered', async (data) => {
      try {
        const { messageId, recipientId } = data;
        console.log('Message delivered:', messageId, 'to:', recipientId);
        
        const message = await Message.findById(messageId);
        if (message) {
          // Update delivery status
          const existingStatus = message.deliveryStatus.find(ds => ds.user.toString() === recipientId);
          if (existingStatus) {
            existingStatus.status = 'delivered';
            existingStatus.timestamp = new Date();
          } else {
            message.deliveryStatus.push({
              user: recipientId,
              status: 'delivered',
              timestamp: new Date()
            });
          }
          await message.save();
          
          // Notify sender about delivery
          const senderSocket = await findUserSocket(message.sender);
          if (senderSocket) {
            senderSocket.emit('message_delivery_update', {
              messageId: message._id,
              status: 'delivered',
              recipientId: recipientId
            });
          }
        }
      } catch (error) {
        console.error('Message delivery error:', error);
      }
    });

    // Handle message read status
    socket.on('mark_message_read', async (data) => {
      try {
        const { messageId } = data;
        const message = await Message.findById(messageId);
        
        if (message) {
          await message.markAsRead(socket.userId);
          
          // Update read status in deliveryStatus
          const existingStatus = message.deliveryStatus.find(ds => ds.user.toString() === socket.userId.toString());
          if (existingStatus) {
            existingStatus.status = 'seen';
            existingStatus.timestamp = new Date();
          } else {
            message.deliveryStatus.push({
              user: socket.userId,
              status: 'seen',
              timestamp: new Date()
            });
          }
          await message.save();
          
          // Notify sender that message was read
          const senderSocket = await findUserSocket(message.sender);
          if (senderSocket) {
            senderSocket.emit('message_read_update', {
              messageId,
              status: 'seen',
              readerId: socket.userId,
              readAt: new Date()
            });
          }
        }
      } catch (error) {
        console.error('Mark message read error:', error);
      }
    });

    // Handle user status updates
    socket.on('update_status', async (data) => {
      try {
        const { status } = data;
        await User.findByIdAndUpdate(socket.userId, { status });
        
        socket.broadcast.emit('user_status_updated', {
          userId: socket.userId,
          status
        });
      } catch (error) {
        console.error('Update status error:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
      console.log(`User ${socket.user.username} disconnected`);

      // Update user's online status
      await User.findByIdAndUpdate(socket.userId, {
        socketId: null,
        isOnline: false,
        lastSeen: new Date()
      });

      // Notify others that user is offline
      socket.broadcast.emit('user_offline', {
        userId: socket.userId
      });
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    });

    // Voice Call Handlers
    socket.on('call_invite', async (data) => {
      try {
        const { callId, callType, offer, from, to } = data;
        
        // Find recipient's socket
        const recipientSocket = await findUserSocket(to._id);
        
        if (recipientSocket) {
          recipientSocket.emit('call_incoming', {
            callId,
            callType,
            offer,
            from: {
              _id: from._id,
              username: from.username,
              displayName: from.displayName,
              avatar: from.avatar
            }
          });
        } else {
          // User is offline
          socket.emit('call_error', {
            message: 'User is offline',
            callId
          });
        }
      } catch (error) {
        console.error('Call invite error:', error);
        socket.emit('call_error', {
          message: 'Failed to send call invitation',
          callId: data.callId
        });
      }
    });

    socket.on('call_accept', async (data) => {
      try {
        const { callId, from, to } = data;
        
        // Find caller's socket
        const callerSocket = await findUserSocket(to._id);
        
        if (callerSocket) {
          callerSocket.emit('call_accepted', {
            callId,
            from: {
              _id: from._id,
              username: from.username,
              displayName: from.displayName,
              avatar: from.avatar
            }
          });
        }
      } catch (error) {
        console.error('Call accept error:', error);
      }
    });

    socket.on('call_reject', async (data) => {
      try {
        const { callId, from, to } = data;
        
        // Find caller's socket
        const callerSocket = await findUserSocket(to._id);
        
        if (callerSocket) {
          callerSocket.emit('call_rejected', {
            callId,
            from: {
              _id: from._id,
              username: from.username,
              displayName: from.displayName,
              avatar: from.avatar
            }
          });
        }
      } catch (error) {
        console.error('Call reject error:', error);
      }
    });

    socket.on('call_end', async (data) => {
      try {
        const { callId, from, to } = data;
        
        // Find recipient's socket
        const recipientSocket = await findUserSocket(to._id);
        
        if (recipientSocket) {
          recipientSocket.emit('call_ended', {
            callId,
            from: {
              _id: from._id,
              username: from.username,
              displayName: from.displayName,
              avatar: from.avatar
            }
          });
        }
      } catch (error) {
        console.error('Call end error:', error);
      }
    });

    socket.on('ice_candidate', async (data) => {
      try {
        const { callId, candidate, to } = data;
        
        // Find recipient's socket
        const recipientSocket = await findUserSocket(to._id);
        
        if (recipientSocket) {
          recipientSocket.emit('ice_candidate', {
            callId,
            candidate,
            from: {
              _id: socket.userId,
              username: socket.user.username,
              displayName: socket.user.displayName
            }
          });
        }
      } catch (error) {
        console.error('ICE candidate error:', error);
      }
    });

    socket.on('offer', async (data) => {
      try {
        const { callId, offer, to } = data;
        
        // Find recipient's socket
        const recipientSocket = await findUserSocket(to._id);
        
        if (recipientSocket) {
          recipientSocket.emit('offer', {
            callId,
            offer,
            from: {
              _id: socket.userId,
              username: socket.user.username,
              displayName: socket.user.displayName
            }
          });
        }
      } catch (error) {
        console.error('Offer error:', error);
      }
    });

    socket.on('answer', async (data) => {
      try {
        const { callId, answer, to } = data;
        
        // Find caller's socket
        const callerSocket = await findUserSocket(to._id);
        
        if (callerSocket) {
          callerSocket.emit('answer', {
            callId,
            answer,
            from: {
              _id: socket.userId,
              username: socket.user.username,
              displayName: socket.user.displayName
            }
          });
        }
      } catch (error) {
        console.error('Answer error:', error);
      }
    });

    // Handle message delivery confirmation
    socket.on('message_delivered', async (data) => {
      try {
        const { messageId } = data;
        const message = await Message.findById(messageId);
        
        if (message) {
          await message.markAsDelivered(socket.userId);
          
          // Notify sender
          const senderSocket = await findUserSocket(message.sender);
          if (senderSocket) {
            senderSocket.emit('message_delivery_update', {
              messageId,
              userId: socket.userId,
              status: 'delivered'
            });
          }
        }
      } catch (error) {
        console.error('Message delivery error:', error);
      }
    });

    // Handle message read confirmation
    socket.on('message_read', async (data) => {
      try {
        const { messageId } = data;
        const message = await Message.findById(messageId);
        
        if (message) {
          await message.markAsRead(socket.userId);
          
          // Notify sender
          const senderSocket = await findUserSocket(message.sender);
          if (senderSocket) {
            senderSocket.emit('message_read_update', {
              messageId,
              userId: socket.userId,
              status: 'seen'
            });
          }
        }
      } catch (error) {
        console.error('Message read error:', error);
      }
    });

    // Handle typing indicator
    socket.on('typing_start', (data) => {
      const { chatType, recipients } = data;
      
      if (chatType === 'private' && recipients && recipients.length === 1) {
        const roomName = [socket.userId, recipients[0]].sort().join('_');
        socket.to(`private_${roomName}`).emit('user_typing', {
          userId: socket.userId,
          username: socket.user.username,
          isTyping: true
        });
      } else if (chatType === 'group' && recipients && recipients.length > 0) {
        socket.to(`group_${recipients[0]}`).emit('user_typing', {
          userId: socket.userId,
          username: socket.user.username,
          isTyping: true
        });
      }
    });

    socket.on('typing_stop', (data) => {
      const { chatType, recipients } = data;
      
      if (chatType === 'private' && recipients && recipients.length === 1) {
        const roomName = [socket.userId, recipients[0]].sort().join('_');
        socket.to(`private_${roomName}`).emit('user_typing', {
          userId: socket.userId,
          username: socket.user.username,
          isTyping: false
        });
      } else if (chatType === 'group' && recipients && recipients.length > 0) {
        socket.to(`group_${recipients[0]}`).emit('user_typing', {
          userId: socket.userId,
          username: socket.user.username,
          isTyping: false
        });
      }
    });

    // Handle message reactions
    socket.on('add_reaction', async (data) => {
      try {
        const { messageId, emoji } = data;
        const message = await Message.findById(messageId);
        
        if (message) {
          const user = await User.findById(socket.userId);
          const existingReaction = message.reactions.find(r => r.user.toString() === socket.userId.toString());
          const wasReplaced = !!existingReaction;
          
          await message.addReaction(socket.userId, emoji);
          
          // Emit to all users in the chat
          const reactionData = {
            messageId,
            userId: socket.userId,
            emoji,
            userName: user?.displayName || user?.username
          };
          
          if (message.chatType === 'private') {
            const roomName = [message.sender.toString(), message.privateChatWith.toString()].sort().join('_');
            io.to(`private_${roomName}`).emit(wasReplaced ? 'reaction_updated' : 'reaction_added', reactionData);
          } else if (message.chatType === 'group') {
            io.to(`group_${message.groupId}`).emit(wasReplaced ? 'reaction_updated' : 'reaction_added', reactionData);
          } else if (message.chatType === 'global') {
            io.emit(wasReplaced ? 'reaction_updated' : 'reaction_added', reactionData);
          }
        }
      } catch (error) {
        console.error('Add reaction error:', error);
      }
    });

    socket.on('remove_reaction', async (data) => {
      try {
        const { messageId, emoji } = data;
        const message = await Message.findById(messageId);
        
        if (message) {
          const user = await User.findById(socket.userId);
          await message.removeReaction(socket.userId, emoji);
          
          // Emit to all users in the chat
          const reactionData = {
            messageId,
            userId: socket.userId,
            emoji,
            userName: user?.displayName || user?.username
          };
          
          if (message.chatType === 'private') {
            const roomName = [message.sender.toString(), message.privateChatWith.toString()].sort().join('_');
            io.to(`private_${roomName}`).emit('reaction_removed', reactionData);
          } else if (message.chatType === 'group') {
            io.to(`group_${message.groupId}`).emit('reaction_removed', reactionData);
          } else if (message.chatType === 'global') {
            io.emit('reaction_removed', reactionData);
          }
        }
      } catch (error) {
        console.error('Remove reaction error:', error);
      }
    });

  });

  // Helper function to find user socket
  const findUserSocket = async (userId) => {
    try {
      const sockets = await io.fetchSockets();
      return sockets.find(socket => socket.userId === userId.toString());
    } catch (error) {
      console.error('Error finding user socket:', error);
      return null;
    }
  };
};

module.exports = { setupSocketHandlers };
