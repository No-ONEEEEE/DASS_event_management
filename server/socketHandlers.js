const jwt = require('jsonwebtoken');
const Message = require('./models/Message');
const Team = require('./models/Team');
const Participant = require('./models/Participant');

// Store online users: { userId: { socketId, teamIds: Set } }
const onlineUsers = new Map();

// Store typing users: { teamId: Set of userIds }
const typingUsers = new Map();

module.exports = (io) => {
  // Socket.io middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
      socket.userId = decoded.id;
      socket.userRole = decoded.role;

      // Get user details
      const user = await Participant.findById(decoded.id).select('firstName lastName email');
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userName = `${user.firstName} ${user.lastName}`;
      socket.userEmail = user.email;

      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userName} (${socket.userId})`);

    // Track online user
    if (!onlineUsers.has(socket.userId)) {
      onlineUsers.set(socket.userId, {
        socketId: socket.id,
        teamIds: new Set()
      });
    }

    // Join team room
    socket.on('join-team', async (teamId) => {
      try {
        // Verify user is part of the team
        const team = await Team.findById(teamId);
        if (!team) {
          socket.emit('error', { message: 'Team not found' });
          return;
        }

        const isLeader = team.teamLeaderId.toString() === socket.userId;
        const isMember = team.members.some(m => 
          m.participantId.toString() === socket.userId && m.status === 'accepted'
        );

        if (!isLeader && !isMember) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Join the room
        socket.join(`team-${teamId}`);
        
        // Track team membership
        const userInfo = onlineUsers.get(socket.userId);
        if (userInfo) {
          userInfo.teamIds.add(teamId);
        }

        // Notify others in the team
        socket.to(`team-${teamId}`).emit('user-joined', {
          userId: socket.userId,
          userName: socket.userName,
          timestamp: new Date()
        });

        // Send current online users in this team
        const onlineInTeam = Array.from(onlineUsers.entries())
          .filter(([userId, info]) => info.teamIds.has(teamId))
          .map(([userId, info]) => ({
            userId,
            socketId: info.socketId
          }));

        socket.emit('online-users', { teamId, users: onlineInTeam });

        console.log(`User ${socket.userName} joined team ${teamId}`);
      } catch (error) {
        console.error('Error joining team:', error);
        socket.emit('error', { message: 'Error joining team' });
      }
    });

    // Leave team room
    socket.on('leave-team', (teamId) => {
      socket.leave(`team-${teamId}`);
      
      const userInfo = onlineUsers.get(socket.userId);
      if (userInfo) {
        userInfo.teamIds.delete(teamId);
      }

      // Notify others
      socket.to(`team-${teamId}`).emit('user-left', {
        userId: socket.userId,
        userName: socket.userName,
        timestamp: new Date()
      });

      // Remove from typing if was typing
      const typingInTeam = typingUsers.get(teamId);
      if (typingInTeam) {
        typingInTeam.delete(socket.userId);
        socket.to(`team-${teamId}`).emit('typing-update', {
          teamId,
          typingUsers: Array.from(typingInTeam)
        });
      }
    });

    // Send message
    socket.on('send-message', async (data) => {
      try {
        const { teamId, content, messageType = 'text', fileUrl, fileName, fileSize, linkUrl, linkTitle } = data;

        // Create message
        const message = new Message({
          teamId,
          senderId: socket.userId,
          senderName: socket.userName,
          messageType,
          content,
          fileUrl,
          fileName,
          fileSize,
          linkUrl,
          linkTitle,
          readBy: [{
            participantId: socket.userId,
            readAt: new Date()
          }]
        });

        await message.save();

        // Populate sender info
        const populatedMessage = await Message.findById(message._id)
          .populate('senderId', 'firstName lastName email');

        // Broadcast to team room
        io.to(`team-${teamId}`).emit('new-message', {
          message: populatedMessage
        });

        // Stop typing indicator
        const typingInTeam = typingUsers.get(teamId);
        if (typingInTeam && typingInTeam.has(socket.userId)) {
          typingInTeam.delete(socket.userId);
          socket.to(`team-${teamId}`).emit('typing-update', {
            teamId,
            typingUsers: Array.from(typingInTeam)
          });
        }

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Error sending message' });
      }
    });

    // Typing indicator
    socket.on('typing-start', ({ teamId }) => {
      if (!typingUsers.has(teamId)) {
        typingUsers.set(teamId, new Set());
      }
      
      const typingInTeam = typingUsers.get(teamId);
      typingInTeam.add(socket.userId);

      socket.to(`team-${teamId}`).emit('typing-update', {
        teamId,
        userId: socket.userId,
        userName: socket.userName,
        isTyping: true
      });
    });

    socket.on('typing-stop', ({ teamId }) => {
      const typingInTeam = typingUsers.get(teamId);
      if (typingInTeam) {
        typingInTeam.delete(socket.userId);

        socket.to(`team-${teamId}`).emit('typing-update', {
          teamId,
          userId: socket.userId,
          userName: socket.userName,
          isTyping: false
        });
      }
    });

    // Message read receipt
    socket.on('message-read', async ({ messageId, teamId }) => {
      try {
        await Message.updateOne(
          {
            _id: messageId,
            'readBy.participantId': { $ne: socket.userId }
          },
          {
            $push: {
              readBy: {
                participantId: socket.userId,
                readAt: new Date()
              }
            }
          }
        );

        // Notify others about read receipt
        socket.to(`team-${teamId}`).emit('message-read-update', {
          messageId,
          userId: socket.userId,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error updating read receipt:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userName} (${socket.userId})`);

      const userInfo = onlineUsers.get(socket.userId);
      if (userInfo) {
        // Notify all teams this user was in
        userInfo.teamIds.forEach(teamId => {
          socket.to(`team-${teamId}`).emit('user-left', {
            userId: socket.userId,
            userName: socket.userName,
            timestamp: new Date()
          });

          // Remove from typing
          const typingInTeam = typingUsers.get(teamId);
          if (typingInTeam) {
            typingInTeam.delete(socket.userId);
            socket.to(`team-${teamId}`).emit('typing-update', {
              teamId,
              typingUsers: Array.from(typingInTeam)
            });
          }
        });

        onlineUsers.delete(socket.userId);
      }
    });
  });

  // Helper function to get online users in a team
  const getOnlineUsersInTeam = (teamId) => {
    return Array.from(onlineUsers.entries())
      .filter(([userId, info]) => info.teamIds.has(teamId))
      .map(([userId, info]) => userId);
  };

  return { onlineUsers, typingUsers, getOnlineUsersInTeam };
};
