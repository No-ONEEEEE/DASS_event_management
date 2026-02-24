const express = require('express');
const router = express.Router();
const { verifyOrganizer } = require('../middleware/auth');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Organizer = require('../models/Organizer');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const axios = require('axios');

// Get organizer dashboard
router.get('/dashboard', verifyOrganizer, async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.user.id);
    const events = await Event.find({ organizerId: req.user.id });

    let totalRegistrations = 0;
    let totalRevenue = 0;
    let completedEvents = 0;

    // Calculate analytics for completed events
    const completedEventsAnalytics = [];
    
    for (let event of events) {
      const registrations = await Registration.find({ eventId: event._id });
      totalRegistrations += registrations.length;

      if (event.eventType === 'Normal' && event.registrationFee) {
        totalRevenue += registrations.filter(r => r.paymentStatus === 'Completed').length * event.registrationFee;
      } else if (event.eventType === 'Merchandise') {
        registrations.forEach(r => {
          if (r.paymentStatus === 'Completed' && r.merchandisePurchase) {
            totalRevenue += r.merchandisePurchase.totalAmount || 0;
          }
        });
      }

      if (event.status === 'Completed') {
        completedEvents++;
        const attendedCount = registrations.filter(r => r.attendance).length;
        completedEventsAnalytics.push({
          eventId: event._id,
          eventName: event.eventName,
          totalRegistrations: registrations.length,
          totalRevenue: event.eventType === 'Normal' 
            ? registrations.filter(r => r.paymentStatus === 'Completed').length * event.registrationFee
            : registrations.reduce((sum, r) => sum + (r.merchandisePurchase?.totalAmount || 0), 0),
          attendance: attendedCount,
          attendanceRate: registrations.length > 0 ? ((attendedCount / registrations.length) * 100).toFixed(2) : 0
        });
      }
    }

    // Events carousel - all events with their status
    const eventsCarousel = events.map(e => ({
      _id: e._id,
      eventName: e.eventName,
      eventType: e.eventType,
      status: e.status,
      eventStartDate: e.eventStartDate,
      eventEndDate: e.eventEndDate,
      currentRegistrations: e.currentRegistrations,
      registrationLimit: e.registrationLimit,
      createdAt: e.createdAt
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      organizer: {
        id: organizer._id,
        organizerName: organizer.organizerName,
        email: organizer.email,
        category: organizer.category,
        description: organizer.description
      },
      stats: {
        totalEvents: events.length,
        draftEvents: events.filter(e => e.status === 'Draft').length,
        publishedEvents: events.filter(e => e.status === 'Published').length,
        ongoingEvents: events.filter(e => e.status === 'Ongoing').length,
        completedEvents,
        totalRegistrations,
        totalRevenue: totalRevenue.toFixed(2)
      },
      eventsCarousel,
      completedEventsAnalytics
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard', error: error.message });
  }
});

// Create event
router.post('/events/create', verifyOrganizer, async (req, res) => {
  try {
    const {
      eventName,
      description,
      eventType,
      eventStartDate,
      eventEndDate,
      registrationDeadline,
      registrationFee,
      registrationLimit,
      eligibility,
      eventTags,
      venue,
      registrationFormFields,
      isTeamEvent,
      minTeamSize,
      maxTeamSize,
      merchandise
    } = req.body;

    console.log('Creating event with registrationFormFields:', registrationFormFields);

    const event = new Event({
      eventName,
      description,
      eventType,
      organizerId: req.user.id,
      eventStartDate,
      eventEndDate,
      registrationDeadline,
      registrationFee,
      registrationLimit,
      eligibility,
      eventTags,
      venue,
      registrationFormFields,
      isTeamEvent,
      minTeamSize,
      maxTeamSize,
      merchandise,
      status: 'Draft'
    });

    await event.save();
    res.status(201).json({ message: 'Event created in draft', event });
  } catch (error) {
    res.status(500).json({ message: 'Error creating event', error: error.message });
  }
});

// Update event
router.put('/events/:eventId', verifyOrganizer, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check if any registrations exist
    const registrationCount = await Registration.countDocuments({ eventId: req.params.eventId });
    const hasRegistrations = registrationCount > 0;

    // Define allowed updates based on event status
    let allowedUpdates = [];

    if (event.status === 'Draft') {
      // Draft: all fields can be edited (free edits)
      allowedUpdates = [
        'eventName', 'description', 'eventStartDate', 'eventEndDate',
        'registrationDeadline', 'registrationFee', 'registrationLimit',
        'eligibility', 'eventTags', 'venue', 'eventType', 'registrationFormFields', 'isTeamEvent', 'minTeamSize', 'maxTeamSize', 'merchandise'
      ];
      
      // Cannot edit registration form if registrations exist
      if (hasRegistrations && req.body.registrationFormFields) {
        return res.status(400).json({ message: 'Cannot modify registration form fields after receiving registrations' });
      }
    } else if (event.status === 'Published') {
      // Published: description update, extend deadline, increase limit
      allowedUpdates = ['description'];
      
      // Validate and allow deadline extension
      if (req.body.registrationDeadline) {
        const newDeadline = new Date(req.body.registrationDeadline);
        const currentDeadline = new Date(event.registrationDeadline);
        
        if (newDeadline > currentDeadline) {
          allowedUpdates.push('registrationDeadline');
        } else if (newDeadline.getTime() !== currentDeadline.getTime()) {
          return res.status(400).json({ message: 'Can only extend registration deadline, not reduce it' });
        }
      }
      
      // Validate and allow limit increase
      if (req.body.registrationLimit !== undefined) {
        if (req.body.registrationLimit > (event.registrationLimit || 0)) {
          allowedUpdates.push('registrationLimit');
        } else if (req.body.registrationLimit !== event.registrationLimit) {
          return res.status(400).json({ message: 'Can only increase registration limit, not reduce it' });
        }
      }
    } else if (['Ongoing', 'Completed', 'Closed'].includes(event.status)) {
      // Ongoing/Completed/Closed: no edits except status change
      return res.status(400).json({ message: 'Cannot edit ongoing, completed, or closed events. Only status changes are allowed via /status endpoint.' });
    }

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    updates.updatedAt = new Date();

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.eventId,
      updates,
      { new: true }
    );

    res.json({ message: 'Event updated', event: updatedEvent });
  } catch (error) {
    res.status(500).json({ message: 'Error updating event', error: error.message });
  }
});

// Publish event
router.post('/events/:eventId/publish', verifyOrganizer, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).populate('organizerId');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizerId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (event.status !== 'Draft') {
      return res.status(400).json({ message: 'Only draft events can be published' });
    }

    event.status = 'Published';
    await event.save();

    // Post to Discord webhook if configured
    if (event.organizerId.discordWebhook) {
      try {
        await axios.post(event.organizerId.discordWebhook, {
          embeds: [{
            title: `New Event: ${event.eventName}`,
            description: event.description,
            color: 5814783, // Purple color
            fields: [
              {
                name: 'Event Type',
                value: event.eventType,
                inline: true
              },
              {
                name: 'Organizer',
                value: event.organizerId.organizerName,
                inline: true
              },
              {
                name: 'Start Date',
                value: new Date(event.eventStartDate).toLocaleDateString(),
                inline: true
              },
              {
                name: 'Registration Deadline',
                value: new Date(event.registrationDeadline).toLocaleDateString(),
                inline: true
              },
              {
                name: 'Fee',
                value: event.registrationFee ? `₹${event.registrationFee}` : 'Free',
                inline: true
              }
            ],
            timestamp: new Date().toISOString()
          }]
        });
      } catch (webhookError) {
        console.error('Discord webhook error:', webhookError.message);
        // Don't fail the publish if webhook fails
      }
    }

    res.json({ message: 'Event published successfully', event });
  } catch (error) {
    res.status(500).json({ message: 'Error publishing event', error: error.message });
  }
});

// Get event details (organizer view)
router.get('/events/:eventId', verifyOrganizer, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).populate('organizerId');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizerId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const registrations = await Registration.find({ eventId: req.params.eventId })
      .populate('participantId', 'firstName lastName email contactNumber')
      .sort({ registeredAt: -1 });

    // Calculate analytics
    let revenue = 0;
    let completedTeams = 0;
    let totalTeamMembers = 0;

    registrations.forEach(reg => {
      if (reg.paymentStatus === 'Completed') {
        if (event.eventType === 'Normal') {
          revenue += event.registrationFee || 0;
        } else if (event.eventType === 'Merchandise') {
          revenue += reg.merchandisePurchase?.totalAmount || 0;
        }
      }

      if (reg.teamMembers && reg.teamMembers.length > 0) {
        totalTeamMembers += reg.teamMembers.length;
        // Check if team is complete (all members have registered)
        const allMembersRegistered = reg.teamMembers.every(member => member.email);
        if (allMembersRegistered) {
          completedTeams++;
        }
      }
    });

    const analytics = {
      totalRegistrations: registrations.length,
      salesCount: registrations.filter(r => r.paymentStatus === 'Completed').length,
      attendance: registrations.filter(r => r.attendance).length,
      teamCompletion: totalTeamMembers > 0 ? `${completedTeams} teams completed` : 'N/A',
      revenue: revenue.toFixed(2),
      statusBreakdown: {
        registered: registrations.filter(r => r.status === 'Registered').length,
        completed: registrations.filter(r => r.status === 'Completed').length,
        cancelled: registrations.filter(r => r.status === 'Cancelled').length,
        rejected: registrations.filter(r => r.status === 'Rejected').length
      }
    };

    // Format participant list
    const participants = registrations.map(reg => ({
      id: reg._id,
      name: `${reg.participantId.firstName} ${reg.participantId.lastName}`,
      email: reg.participantId.email,
      contactNumber: reg.participantId.contactNumber,
      registrationDate: reg.registeredAt,
      paymentStatus: reg.paymentStatus,
      team: reg.teamName || 'Individual',
      teamMembers: reg.teamMembers,
      attendance: reg.attendance || false,
      status: reg.status,
      ticketId: reg.ticketId,
      formResponses: reg.formResponses
    }));

    res.json({
      event: event.toJSON(),
      analytics,
      participants
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching event', error: error.message });
  }
});

// Get all organizer events
router.get('/events', verifyOrganizer, async (req, res) => {
  try {
    const events = await Event.find({ organizerId: req.user.id }).sort({ createdAt: -1 });
    const eventsData = events.map(event => event.toJSON());
    res.json(eventsData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events', error: error.message });
  }
});

// Close registrations for an event
router.post('/events/:eventId/close-registrations', verifyOrganizer, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (event.status !== 'Published') {
      return res.status(400).json({ message: 'Can only close registrations for published events' });
    }

    event.status = 'Closed';
    event.updatedAt = new Date();
    await event.save();

    res.json({ message: 'Registrations closed successfully', event });
  } catch (error) {
    res.status(500).json({ message: 'Error closing registrations', error: error.message });
  }
});

// Change event status
router.put('/events/:eventId/status', verifyOrganizer, async (req, res) => {
  try {
    const { status } = req.body;
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const validStatuses = ['Draft', 'Published', 'Ongoing', 'Completed', 'Closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    event.status = status;
    event.updatedAt = new Date();
    await event.save();

    res.json({ message: `Event status changed to ${status}`, event });
  } catch (error) {
    res.status(500).json({ message: 'Error changing event status', error: error.message });
  }
});

// Export participants as CSV
router.get('/events/:eventId/export-csv', verifyOrganizer, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.organizerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const registrations = await Registration.find({ eventId: req.params.eventId })
      .populate('participantId', 'firstName lastName email contactNumber');

    // Build CSV content
    let csv = 'Name,Email,Contact Number,Registration Date,Payment Status,Team,Attendance,Status,Ticket ID\n';

    registrations.forEach(reg => {
      const name = `${reg.participantId.firstName} ${reg.participantId.lastName}`;
      const email = reg.participantId.email;
      const contact = reg.participantId.contactNumber || 'N/A';
      const regDate = new Date(reg.registeredAt).toLocaleDateString();
      const payment = reg.paymentStatus;
      const team = reg.teamName || 'Individual';
      const attendance = reg.attendance ? 'Yes' : 'No';
      const status = reg.status;
      const ticketId = reg.ticketId;

      csv += `"${name}","${email}","${contact}","${regDate}","${payment}","${team}","${attendance}","${status}","${ticketId}"\n`;

      // Add team members if any
      if (reg.teamMembers && reg.teamMembers.length > 0) {
        reg.teamMembers.forEach(member => {
          csv += `"${member.name} (Team Member)","${member.email}","N/A","${regDate}","N/A","${team}","N/A","Team Member","N/A"\n`;
        });
      }
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${event.eventName}_participants.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Error exporting CSV', error: error.message });
  }
});

// Update organizer profile
router.put('/profile', verifyOrganizer, async (req, res) => {
  try {
    const { organizerName, category, description, contactEmail, discordWebhook } = req.body;

    const organizer = await Organizer.findByIdAndUpdate(
      req.user.id,
      { organizerName, category, description, contactEmail, discordWebhook },
      { new: true }
    );

    res.json({ message: 'Profile updated', organizer });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Submit password reset request to admin
router.post('/password-reset-request', verifyOrganizer, async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ message: 'Please provide a detailed reason (at least 10 characters)' });
    }

    // Check if there's already a pending request
    const existingRequest = await PasswordResetRequest.findOne({
      organizerId: req.user.id,
      status: 'Pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You already have a pending password reset request' });
    }

    const resetRequest = new PasswordResetRequest({
      organizerId: req.user.id,
      reason: reason.trim()
    });

    await resetRequest.save();

    res.json({ 
      message: 'Password reset request submitted successfully. Admin will review your request.',
      requestId: resetRequest._id
    });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting password reset request', error: error.message });
  }
});

// Get organizer's password reset requests (history)
router.get('/password-reset-requests', verifyOrganizer, async (req, res) => {
  try {
    const requests = await PasswordResetRequest.find({ organizerId: req.user.id })
      .sort({ requestDate: -1 })
      .select('-newPassword'); // Don't send the password in history

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching password reset requests', error: error.message });
  }
});

// Get organizer profile
router.get('/profile', verifyOrganizer, async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.user.id).select('-password');
    
    // Get password reset request history
    const resetRequests = await PasswordResetRequest.find({ organizerId: req.user.id })
      .sort({ requestDate: -1 })
      .select('-newPassword')
      .limit(10);

    res.json({ 
      organizer,
      resetRequests
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Scan QR code and mark attendance
router.post('/events/:eventId/scan-attendance', verifyOrganizer, async (req, res) => {
  try {
    const { qrCode } = req.body;
    const eventId = req.params.eventId;

    // Verify event belongs to organizer
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (event.organizerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Find registration by QR code
    const registration = await Registration.findOne({ qrCode, eventId })
      .populate('participantId', 'firstName lastName email');

    if (!registration) {
      return res.status(404).json({ message: 'Invalid QR code or registration not found' });
    }

    // Check if already scanned
    if (registration.attendance) {
      return res.status(400).json({ 
        message: 'Duplicate scan detected',
        participant: {
          name: `${registration.participantId.firstName} ${registration.participantId.lastName}`,
          email: registration.participantId.email,
          firstScanTime: registration.attendanceTimestamp
        }
      });
    }

    // Mark attendance
    registration.attendance = true;
    registration.attendanceTimestamp = new Date();
    registration.attendanceMethod = 'QR_SCAN';
    registration.attendanceMarkedBy = req.user.id;
    await registration.save();

    res.json({
      message: 'Attendance marked successfully',
      participant: {
        name: `${registration.participantId.firstName} ${registration.participantId.lastName}`,
        email: registration.participantId.email,
        ticketId: registration.ticketId,
        scanTime: registration.attendanceTimestamp
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error scanning attendance', error: error.message });
  }
});

// Manual attendance override
router.post('/events/:eventId/manual-attendance', verifyOrganizer, async (req, res) => {
  try {
    const { ticketId, notes } = req.body;
    const eventId = req.params.eventId;

    // Verify event belongs to organizer
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (event.organizerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Find registration by ticket ID
    const registration = await Registration.findOne({ ticketId, eventId })
      .populate('participantId', 'firstName lastName email');

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Mark attendance manually
    registration.attendance = true;
    registration.attendanceTimestamp = new Date();
    registration.attendanceMethod = 'MANUAL_OVERRIDE';
    registration.attendanceNotes = notes || 'Manual override by organizer';
    registration.attendanceMarkedBy = req.user.id;
    await registration.save();

    res.json({
      message: 'Attendance marked manually',
      participant: {
        name: `${registration.participantId.firstName} ${registration.participantId.lastName}`,
        email: registration.participantId.email,
        ticketId: registration.ticketId,
        scanTime: registration.attendanceTimestamp
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error marking manual attendance', error: error.message });
  }
});

// Get live attendance dashboard
router.get('/events/:eventId/attendance-dashboard', verifyOrganizer, async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Verify event belongs to organizer
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (event.organizerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Get all registrations
    const registrations = await Registration.find({ eventId })
      .populate('participantId', 'firstName lastName email contactNumber')
      .sort({ attendanceTimestamp: -1 });

    const scanned = registrations.filter(r => r.attendance);
    const notScanned = registrations.filter(r => !r.attendance);

    const attendanceData = {
      totalRegistrations: registrations.length,
      scannedCount: scanned.length,
      notScannedCount: notScanned.length,
      attendanceRate: registrations.length > 0 
        ? ((scanned.length / registrations.length) * 100).toFixed(2) 
        : 0,
      scanned: scanned.map(r => ({
        name: `${r.participantId.firstName} ${r.participantId.lastName}`,
        email: r.participantId.email,
        ticketId: r.ticketId,
        scanTime: r.attendanceTimestamp,
        method: r.attendanceMethod,
        notes: r.attendanceNotes
      })),
      notScanned: notScanned.map(r => ({
        name: `${r.participantId.firstName} ${r.participantId.lastName}`,
        email: r.participantId.email,
        ticketId: r.ticketId,
        contactNumber: r.participantId.contactNumber
      }))
    };

    res.json(attendanceData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance dashboard', error: error.message });
  }
});

// Export attendance as CSV
router.get('/events/:eventId/export-attendance-csv', verifyOrganizer, async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Verify event belongs to organizer
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    if (event.organizerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Get all registrations
    const registrations = await Registration.find({ eventId })
      .populate('participantId', 'firstName lastName email contactNumber')
      .sort({ attendanceTimestamp: -1 });

    // Create CSV content
    let csv = 'Name,Email,Contact Number,Ticket ID,Attendance,Scan Time,Method,Notes\n';
    
    registrations.forEach(r => {
      const name = `${r.participantId.firstName} ${r.participantId.lastName}`;
      const email = r.participantId.email;
      const contact = r.participantId.contactNumber || 'N/A';
      const ticketId = r.ticketId;
      const attendance = r.attendance ? 'Present' : 'Absent';
      const scanTime = r.attendanceTimestamp 
        ? new Date(r.attendanceTimestamp).toLocaleString() 
        : 'N/A';
      const method = r.attendanceMethod || 'N/A';
      const notes = r.attendanceNotes ? r.attendanceNotes.replace(/,/g, ';') : '';
      
      csv += `"${name}","${email}","${contact}","${ticketId}","${attendance}","${scanTime}","${method}","${notes}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${event.eventName}_attendance.csv"`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Error exporting attendance CSV', error: error.message });
  }
});

module.exports = router;
