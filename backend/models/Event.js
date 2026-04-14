const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  eventType: {
    type: String,
    enum: ['Normal', 'Merchandise'],
    required: true
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
    required: true
  },
  eventStartDate: {
    type: Date,
    required: true
  },
  eventEndDate: {
    type: Date,
    required: true
  },
  registrationDeadline: {
    type: Date,
    required: true
  },
  registrationFee: {
    type: Number,
    default: 0
  },
  registrationLimit: {
    type: Number
  },
  currentRegistrations: {
    type: Number,
    default: 0
  },
  eligibility: {
    type: String
  },
  eventTags: [String],
  venue: {
    type: String
  },
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Ongoing', 'Completed', 'Closed'],
    default: 'Draft'
  },
  registrationFormFields: [{
    fieldLabel: String,
    fieldType: String, // text, email, number, tel, date, etc.
    isRequired: Boolean
  }],
  customForm: {
    fields: [{
      fieldName: String,
      fieldType: String, // text, dropdown, checkbox, file, etc.
      required: Boolean,
      options: [String]
    }]
  },
  isTeamEvent: {
    type: Boolean,
    default: false
  },
  minTeamSize: {
    type: Number,
    default: 1
  },
  maxTeamSize: {
    type: Number,
    default: 1
  },
  // For Merchandise events
  merchandise: {
    items: [{
      itemName: String,
      size: [String],
      color: [String],
      quantity: Number,
      pricePerItem: Number,
      maxPurchasePerParticipant: Number
    }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Transform customForm.fields to registrationFormFields for frontend compatibility
eventSchema.methods.toJSON = function() {
  const event = this.toObject();
  
  // If registrationFormFields is empty but customForm.fields exists, map it
  if ((!event.registrationFormFields || event.registrationFormFields.length === 0) && 
      event.customForm && event.customForm.fields && event.customForm.fields.length > 0) {
    event.registrationFormFields = event.customForm.fields.map(field => ({
      fieldLabel: field.fieldName || field.fieldLabel,
      fieldType: field.fieldType || 'text',
      isRequired: field.required !== undefined ? field.required : field.isRequired
    }));
  }
  
  return event;
};

module.exports = mongoose.model('Event', eventSchema);
