const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

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

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        console.log('Received message:', data);
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
          replyTo
        };

        // Handle different chat types
        if (chatType === 'global') {
          messageData.recipients = []; // Global chat doesn't need specific recipients
        } else if (chatType === 'private' && recipients && recipients.length === 1) {
          messageData.privateChatWith = recipients[0];
        }

        const message = new Message(messageData);
        await message.save();

        // Populate sender info
        await message.populate('sender', 'username displayName avatar');

        // Emit to appropriate room
        if (chatType === 'global') {
          io.to('global_chat').emit('message_received', message);
        } else if (chatType === 'private') {
          const roomName = [socket.userId, recipients[0]].sort().join('_');
          io.to(`private_${roomName}`).emit('message_received', message);
          
          // Notify recipient if they're not in the chat
          const recipientSocket = await findUserSocket(recipients[0]);
          if (recipientSocket && !recipientSocket.rooms.has(`private_${roomName}`)) {
            recipientSocket.emit('new_private_message', {
              message,
              sender: socket.user.getPublicProfile()
            });
          }
        }

        // Update message status to delivered for online recipients
        if (chatType === 'private' && recipients) {
          const onlineRecipients = recipients.filter(async (recipientId) => {
            const recipientSocket = await findUserSocket(recipientId);
            return recipientSocket && recipientSocket.rooms.has(`private_${roomName}`);
          });
          
          if (onlineRecipients.length > 0) {
            message.status = 'delivered';
            await message.save();
          }
        }

        console.log('Message sent successfully:', message._id);
        socket.emit('message_sent', message);

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

    // Handle message read status
    socket.on('mark_message_read', async (data) => {
      try {
        const { messageId } = data;
        const message = await Message.findById(messageId);
        
        if (message) {
          await message.markAsRead(socket.userId);
          
          // Notify sender that message was read
          const senderSocket = await findUserSocket(message.sender);
          if (senderSocket) {
            senderSocket.emit('message_read', {
              messageId,
              readBy: socket.userId,
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
