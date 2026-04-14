const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  participantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  status: {
    type: String,
    enum: ['Registered', 'Completed', 'Cancelled', 'Rejected'],
    default: 'Registered'
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  formResponses: mongoose.Schema.Types.Mixed,
  ticketId: {
    type: String,
    unique: true
  },
  qrCode: String,
  teamName: String,
  teamMembers: [{
    name: String,
    email: String,
    rollNumber: String
  }],
  merchandisePurchase: {
    items: [{
      itemId: String,
      quantity: Number,
      selectedSize: String,
      selectedColor: String
    }],
    totalAmount: Number,
    paymentStatus: String
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed'],
    default: 'Pending'
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  attendance: {
    type: Boolean,
    default: false
  },
  attendanceTimestamp: {
    type: Date
  },
  attendanceMethod: {
    type: String,
    enum: ['QR_SCAN', 'MANUAL_OVERRIDE']
  },
  attendanceNotes: {
    type: String
  },
  attendanceMarkedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer'
  }
});

module.exports = mongoose.model('Registration', registrationSchema);
