const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  teamName: {
    type: String,
    required: true
  },
  teamLeaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant',
    required: true
  },
  teamSize: {
    type: Number,
    required: true
  },
  inviteCode: {
    type: String,
    required: true,
    unique: true
  },
  inviteLink: {
    type: String
  },
  members: [{
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Participant'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    },
    invitedAt: {
      type: Date,
      default: Date.now
    },
    respondedAt: Date
  }],
  status: {
    type: String,
    enum: ['forming', 'complete', 'registered'],
    default: 'forming'
  },
  registrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
});

// Virtual to check if team is full
teamSchema.virtual('isFull').get(function() {
  const acceptedMembers = this.members.filter(m => m.status === 'accepted').length;
  return acceptedMembers + 1 >= this.teamSize; // +1 for team leader
});

// Virtual to get accepted members count
teamSchema.virtual('acceptedCount').get(function() {
  return this.members.filter(m => m.status === 'accepted').length + 1; // +1 for team leader
});

teamSchema.set('toJSON', { virtuals: true });
teamSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Team', teamSchema);
