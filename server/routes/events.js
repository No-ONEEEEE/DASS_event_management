const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const QRCode = require('qrcode');
const { verifyToken, verifyParticipant } = require('../middleware/auth');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Organizer = require('../models/Organizer');
const Participant = require('../models/Participant');
const { sendTicketEmail, sendMerchandiseConfirmationEmail } = require('../utils/emailService');

// Get all categories
router.get('/categories', verifyToken, async (req, res) => {
  try {
    const categories = ['Academic', 'Cultural', 'Technical', 'Sports', 'Social'];
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

// Browse events with search and filters
router.get('/browse', verifyToken, async (req, res) => {
  try {
    const { search, eventType, eligibility, dateStart, dateEnd, trending, followedClubs, category } = req.query;
    let query = { status: { $in: ['Published', 'Ongoing'] } };

    // Search by name/organizer name
    if (search) {
      const organizers = await Organizer.find({
        organizerName: { $regex: search, $options: 'i' }
      }).select('_id');
      
      query.$or = [
        { eventName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { eventTags: { $in: [new RegExp(search, 'i')] } },
        { organizerId: { $in: organizers.map(o => o._id) } }
      ];
    }

    // Filter by event type
    if (eventType && eventType !== 'All') {
      query.eventType = eventType;
    }

    // Filter by eligibility
    if (eligibility) {
      query.eligibility = { $regex: eligibility, $options: 'i' };
    }

    // Filter by date range
    if (dateStart || dateEnd) {
      query.eventStartDate = {};
      if (dateStart) query.eventStartDate.$gte = new Date(dateStart);
      if (dateEnd) query.eventStartDate.$lte = new Date(dateEnd);
    }

    // Filter by followed clubs (only if logged in as participant)
    if (followedClubs === 'true' && req.user && req.user.userType === 'Participant') {
      const Participant = require('../models/Participant');
      const participant = await Participant.findById(req.user.id);
      if (participant && participant.followedClubs.length > 0) {
        query.organizerId = { $in: participant.followedClubs };
      }
    }

    // Filter by category
    if (category) {
      const organizers = await Organizer.find({ category }).select('_id');
      query.organizerId = { $in: organizers.map(o => o._id) };
    }

    let events = await Event.find(query).populate('organizerId').limit(100);

    // Sort by trending (Top 5 events by registrations in last 24h)
    if (trending === 'true') {
      // Get registrations from last 24 hours
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentRegistrations = await Registration.aggregate([
        { $match: { registrationDate: { $gte: last24Hours } } },
        { $group: { _id: '$eventId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);

      // Map event IDs to registration counts
      const trendingMap = {};
      recentRegistrations.forEach(r => {
        trendingMap[r._id.toString()] = r.count;
      });

      // Filter events that have registrations in last 24h
      events = events.filter(e => trendingMap[e._id.toString()]);
      
      // Sort by registration count in last 24h
      events = events.sort((a, b) => 
        (trendingMap[b._id.toString()] || 0) - (trendingMap[a._id.toString()] || 0)
      );
      
      events = events.slice(0, 5);
    } else {
      // Sort by date (upcoming first)
      events = events.sort((a, b) => new Date(a.eventStartDate) - new Date(b.eventStartDate));
    }

    // Transform events to include registrationFormFields
    const eventsData = events.map(event => event.toJSON());
    res.json(eventsData);
  } catch (error) {
    res.status(500).json({ message: 'Error browsing events', error: error.message });
  }
});

// Get event details
router.get('/:eventId', verifyToken, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId).populate('organizerId');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const registrationCount = await Registration.countDocuments({ eventId: req.params.eventId });

    // Use toJSON to ensure registrationFormFields transformation
    const eventData = event.toJSON();
    eventData.currentRegistrations = registrationCount;

    console.log('Returning event data with registrationFormFields:', eventData.registrationFormFields);

    res.json(eventData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching event', error: error.message });
  }
});

// Register for event
router.post('/:eventId/register', verifyParticipant, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { formResponses, merchandisePurchase, teamMembers, teamName } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Validation: Check event status
    if (event.status !== 'Published' && event.status !== 'Ongoing') {
      return res.status(400).json({ message: 'Event is not open for registration' });
    }

    // Validation: Check registration deadline
    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ message: 'Registration deadline has passed' });
    }

    // Validation: Check registration limit
    if (event.registrationLimit && event.currentRegistrations >= event.registrationLimit) {
      return res.status(400).json({ message: 'Event registration limit reached' });
    }

    // Validation: Check for existing registration
    const existingRegistration = await Registration.findOne({
      participantId: req.user.id,
      eventId
    });

    if (existingRegistration) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // Validation: For merchandise events, check stock
    if (event.eventType === 'Merchandise' && merchandisePurchase) {
      for (let item of merchandisePurchase.items) {
        const merchandiseItem = event.merchandise.items.find(m => m._id.toString() === item.itemId);
        if (!merchandiseItem) {
          return res.status(400).json({ message: 'Invalid merchandise item' });
        }
        if (merchandiseItem.quantity < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for ${merchandiseItem.itemName}` });
        }
        if (item.quantity > merchandiseItem.maxPurchasePerParticipant) {
          return res.status(400).json({ 
            message: `Maximum ${merchandiseItem.maxPurchasePerParticipant} items allowed for ${merchandiseItem.itemName}` 
          });
        }
      }
    }

    // Generate unique ticket ID and QR code
    const ticketId = `TKT-${Date.now()}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    
    // Generate QR code image as data URL
    const qrData = {
      ticketId: ticketId,
      participantId: req.user.id,
      eventId: eventId,
      registrationDate: new Date()
    };
    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

    const registration = new Registration({
      participantId: req.user.id,
      eventId,
      formResponses,
      merchandisePurchase,
      teamMembers,
      teamName,
      ticketId,
      qrCode,
      status: 'Registered',
      paymentStatus: event.registrationFee > 0 ? 'Pending' : 'Completed'
    });

    await registration.save();
    event.currentRegistrations += 1;
    
    // Decrement stock for merchandise purchases
    if (event.eventType === 'Merchandise' && merchandisePurchase && merchandisePurchase.items) {
      for (let item of merchandisePurchase.items) {
        const merchandiseItem = event.merchandise.items.find(m => m._id.toString() === item.itemId);
        if (merchandiseItem) {
          merchandiseItem.quantity -= item.quantity;
        }
      }
    }
    
    await event.save();

    // Get participant details for email
    const participant = await Participant.findById(req.user.id);
    
    // Send confirmation email
    try {
      if (event.eventType === 'Merchandise' && merchandisePurchase) {
        // Send merchandise confirmation email
        const merchandiseItemsWithNames = merchandisePurchase.items.map(item => {
          const merchandiseItem = event.merchandise.items.find(m => m._id.toString() === item.itemId);
          return {
            itemName: merchandiseItem ? merchandiseItem.itemName : 'Item',
            quantity: item.quantity,
            selectedSize: item.selectedSize,
            selectedColor: item.selectedColor
          };
        });
        
        await sendMerchandiseConfirmationEmail(
          participant.email,
          `${participant.firstName} ${participant.lastName}`,
          {
            eventName: event.eventName,
            eventType: event.eventType,
            eventStartDate: event.eventStartDate,
            venue: event.venue
          },
          {
            ticketId: ticketId,
            qrCode: qrCode,
            registrationId: registration._id
          },
          merchandiseItemsWithNames,
          merchandisePurchase.totalAmount
        );
      } else {
        // Send normal event ticket email
        await sendTicketEmail(
          participant.email,
          `${participant.firstName} ${participant.lastName}`,
          {
            eventName: event.eventName,
            eventType: event.eventType,
            eventStartDate: event.eventStartDate,
            venue: event.venue
          },
          {
            ticketId: ticketId,
            qrCode: qrCode,
            registrationId: registration._id
          }
        );
      }
      console.log(`✅ Confirmation email sent to ${participant.email}`);
    } catch (emailError) {
      // Don't fail registration if email fails
      console.error('⚠️ Failed to send confirmation email:', emailError.message);
    }

    res.status(201).json({
      message: 'Registered successfully',
      registration,
      ticketId,
      qrCode
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering for event', error: error.message });
  }
});

// Cancel registration
router.post('/:eventId/cancel', verifyParticipant, async (req, res) => {
  try {
    const eventId = req.params.eventId;

    const registration = await Registration.findOne({
      participantId: req.user.id,
      eventId
    });

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    if (registration.status === 'Cancelled') {
      return res.status(400).json({ message: 'Already cancelled' });
    }

    registration.status = 'Cancelled';
    await registration.save();

    const event = await Event.findById(eventId);
    event.currentRegistrations = Math.max(0, event.currentRegistrations - 1);
    await event.save();

    res.json({ message: 'Registration cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling registration', error: error.message });
  }
});

// Get organizer clubs list
router.get('/clubs/list', verifyToken, async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = { isApproved: true };
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { organizerName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const clubs = await Organizer.find(query)
      .select('organizerName category description contactEmail followers')
      .lean();
    
    // Add follower count to each club
    const clubsWithStats = clubs.map(club => ({
      ...club,
      followerCount: club.followers ? club.followers.length : 0
    }));
    
    res.json(clubsWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching clubs', error: error.message });
  }
});

// Get organizer details
router.get('/club/:clubId', verifyToken, async (req, res) => {
  try {
    const club = await Organizer.findById(req.params.clubId).select('-password');
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    const now = new Date();
    const allEvents = await Event.find({ 
      organizerId: req.params.clubId, 
      status: { $in: ['Published', 'Ongoing', 'Completed'] }
    }).sort({ eventStartDate: -1 });

    const upcomingEvents = allEvents.filter(e => new Date(e.eventStartDate) > now);
    const pastEvents = allEvents.filter(e => new Date(e.eventEndDate) <= now);
    
    // Check if current user is following this club
    let isFollowing = false;
    if (req.user && req.user.userType === 'Participant') {
      const Participant = require('../models/Participant');
      const participant = await Participant.findById(req.user.id);
      isFollowing = participant.followedClubs.some(id => id.toString() === req.params.clubId);
    }

    res.json({
      club,
      upcomingEvents,
      pastEvents,
      followerCount: club.followers ? club.followers.length : 0,
      isFollowing
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching club details', error: error.message });
  }
});

module.exports = router;
