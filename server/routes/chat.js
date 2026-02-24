const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verifyParticipant } = require('../middleware/auth');
const Message = require('../models/Message');
const Team = require('../models/Team');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/chat-files/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip|rar|mp4|mp3|csv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('File type not allowed. Allowed types: images, PDFs, documents, archives, videos, audio'));
    }
  }
});

// Get chat history for a team
router.get('/team/:teamId/messages', verifyParticipant, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { limit = 100, before } = req.query;

    // Verify user is part of the team
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const isLeader = team.teamLeaderId.toString() === req.user.id;
    const isMember = team.members.some(m => 
      m.participantId.toString() === req.user.id && m.status === 'accepted'
    );

    if (!isLeader && !isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Build query
    const query = { 
      teamId,
      isDeleted: false
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    // Fetch messages
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('senderId', 'firstName lastName email');

    // Reverse to get chronological order
    messages.reverse();

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

// Mark messages as read
router.post('/team/:teamId/messages/read', verifyParticipant, async (req, res) => {
  try {
    const { teamId } = req.params;
    const { messageIds } = req.body;

    await Message.updateMany(
      {
        _id: { $in: messageIds },
        teamId,
        'readBy.participantId': { $ne: req.user.id }
      },
      {
        $push: {
          readBy: {
            participantId: req.user.id,
            readAt: new Date()
          }
        }
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ message: 'Error marking messages as read', error: error.message });
  }
});

// Get unread message count
router.get('/team/:teamId/unread-count', verifyParticipant, async (req, res) => {
  try {
    const { teamId } = req.params;

    const count = await Message.countDocuments({
      teamId,
      isDeleted: false,
      senderId: { $ne: req.user.id },
      'readBy.participantId': { $ne: req.user.id }
    });

    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ message: 'Error getting unread count', error: error.message });
  }
});

// Delete a message (soft delete)
router.delete('/messages/:messageId', verifyParticipant, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only sender can delete their message
    if (message.senderId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }

    message.isDeleted = true;
    await message.save();

    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Error deleting message', error: error.message });
  }
});

// Upload file to team chat
router.post('/team/:teamId/upload', verifyParticipant, upload.single('file'), async (req, res) => {
  try {
    const { teamId } = req.params;

    // Verify user is part of the team
    const team = await Team.findById(teamId).populate('teamLeaderId', 'firstName lastName');
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const isLeader = team.teamLeaderId._id.toString() === req.user.id;
    const isMember = team.members.some(m => 
      m.participantId.toString() === req.user.id && m.status === 'accepted'
    );

    if (!isLeader && !isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Create file message
    const message = new Message({
      teamId,
      senderId: req.user.id,
      messageType: 'file',
      content: `Shared a file: ${req.file.originalname}`,
      fileName: req.file.originalname,
      fileUrl: `/uploads/chat-files/${req.file.filename}`,
      fileSize: req.file.size
    });

    await message.save();

    // Populate sender info
    await message.populate('senderId', 'firstName lastName email');

    res.json({ 
      message: 'File uploaded successfully',
      fileMessage: message
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
});

module.exports = router;
