const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant',
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'link', 'system'],
    default: 'text'
  },
  content: {
    type: String,
    required: true
  },
  fileUrl: String,
  fileName: String,
  fileSize: Number,
  linkUrl: String,
  linkTitle: String,
  readBy: [{
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Participant'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDeleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for efficient retrieval of team messages
messageSchema.index({ teamId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
