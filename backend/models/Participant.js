const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const participantSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  participantType: {
    type: String,
    enum: ['Student', 'Professional'],
    default: 'Student'
  },
  collegeName: {
    type: String
  },
  contactNumber: {
    type: String,
    required: true
  },
  isIIITStudent: {
    type: Boolean,
    default: false
  },
  organizationName: {
    type: String
  },
  interests: [{
    type: String,
    enum: ['Academic', 'Cultural', 'Technical', 'Sports', 'Social']
  }],
  followedClubs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer'
  }],
  preferences: {
    eventType: [String],
    dateRange: {
      start: Date,
      end: Date
    },
    sortBy: String
  },
  hasCompletedOnboarding: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
participantSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
participantSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Participant', participantSchema);
