const express = require('express');
const router = express.Router();
const { verifyParticipant } = require('../middleware/auth');
const Participant = require('../models/Participant');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Organizer = require('../models/Organizer');

// Get participant dashboard
router.get('/dashboard', verifyParticipant, async (req, res) => {
  try {
    const participant = await Participant.findById(req.user.id).populate('followedClubs');
    const registrations = await Registration.find({ participantId: req.user.id })
      .populate({
        path: 'eventId',
        select: 'eventName eventType eventStartDate eventEndDate status registrationDeadline merchandise',
        populate: {
          path: 'organizerId',
          select: 'organizerName category'
        }
      })
      .sort({ registrationDate: -1 });
    
    const now = new Date();
    
    // Categorize by event type and status
    const upcomingEvents = registrations.filter(r => 
      r.eventId && 
      new Date(r.eventId.eventStartDate) > now && 
      (r.status === 'Registered' || r.status === 'Pending')
    );
    
    const participationHistory = {
      normal: registrations.filter(r => r.eventId && r.eventId.eventType === 'Normal' && r.status === 'Registered'),
      merchandise: registrations.filter(r => r.eventId && r.eventId.eventType === 'Merchandise' && (r.status === 'Registered' || r.status === 'Completed')),
      completed: registrations.filter(r => r.status === 'Completed'),
      cancelled: registrations.filter(r => r.status === 'Cancelled' || r.status === 'Rejected')
    };

    res.json({
      participant,
      upcomingEvents,
      participationHistory,
      stats: {
        totalRegistrations: registrations.length,
        upcomingCount: upcomingEvents.length,
        completedCount: participationHistory.completed.length,
        cancelledCount: participationHistory.cancelled.length,
        followedClubsCount: participant.followedClubs.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard', error: error.message });
  }
});

// Get participant profile
router.get('/profile', verifyParticipant, async (req, res) => {
  try {
    const participant = await Participant.findById(req.user.id).populate('followedClubs');
    res.json(participant);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Update participant profile
router.put('/profile', verifyParticipant, async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      contactNumber, 
      collegeName, 
      organizationName,
      interests,
      preferences 
    } = req.body;
    
    const updateFields = {};
    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (contactNumber) updateFields.contactNumber = contactNumber;
    if (collegeName) updateFields.collegeName = collegeName;
    if (organizationName) updateFields.organizationName = organizationName;
    if (interests) updateFields.interests = interests;
    if (preferences) updateFields.preferences = preferences;

    const participant = await Participant.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true }
    ).populate('followedClubs');

    res.json({ message: 'Profile updated successfully', participant });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Follow/Unfollow organizer
router.post('/follow/:organizerId', verifyParticipant, async (req, res) => {
  try {
    const participant = await Participant.findById(req.user.id);
    const organizerId = req.params.organizerId;
    
    // Verify organizer exists
    const organizer = await Organizer.findById(organizerId);
    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    const isFollowing = participant.followedClubs.some(id => id.toString() === organizerId);

    if (isFollowing) {
      // Unfollow
      participant.followedClubs = participant.followedClubs.filter(id => id.toString() !== organizerId);
      organizer.followers = organizer.followers.filter(id => id.toString() !== req.user.id);
      
      await participant.save();
      await organizer.save();
      
      res.json({ message: 'Unfollowed successfully', isFollowing: false });
    } else {
      // Follow
      participant.followedClubs.push(organizerId);
      if (!organizer.followers.includes(req.user.id)) {
        organizer.followers.push(req.user.id);
      }
      
      await participant.save();
      await organizer.save();
      
      res.json({ message: 'Followed successfully', isFollowing: true });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error following organizer', error: error.message });
  }
});

// Get registration history
router.get('/registrations', verifyParticipant, async (req, res) => {
  try {
    const registrations = await Registration.find({ participantId: req.user.id })
      .populate('eventId')
      .sort({ registrationDate: -1 });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching registrations', error: error.message });
  }
});

// Get registration by ID
router.get('/registrations/:registrationId', verifyParticipant, async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.registrationId)
      .populate('eventId')
      .populate('participantId', 'firstName lastName email');
    
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    
    if (registration.participantId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(registration);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching registration', error: error.message });
  }
});

// Reset password
router.post('/reset-password', verifyParticipant, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const participant = await Participant.findById(req.user.id);

    const isValid = await participant.comparePassword(oldPassword);
    if (!isValid) {
      return res.status(401).json({ message: 'Old password is incorrect' });
    }

    participant.password = newPassword;
    await participant.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error changing password', error: error.message });
  }
});

// Save preferences (onboarding or update)
router.post('/preferences', verifyParticipant, async (req, res) => {
  try {
    const { interests, followedClubs } = req.body;
    
    const participant = await Participant.findById(req.user.id);
    
    if (interests && Array.isArray(interests)) {
      participant.interests = interests;
    }
    
    if (followedClubs && Array.isArray(followedClubs)) {
      // Add new clubs to followed list (avoid duplicates)
      followedClubs.forEach(clubId => {
        if (!participant.followedClubs.includes(clubId)) {
          participant.followedClubs.push(clubId);
        }
      });
    }
    
    participant.hasCompletedOnboarding = true;
    await participant.save();

    res.json({ message: 'Preferences saved successfully', participant });
  } catch (error) {
    res.status(500).json({ message: 'Error saving preferences', error: error.message });
  }
});

// Get recommended events based on preferences
router.get('/recommended-events', verifyParticipant, async (req, res) => {
  try {
    const participant = await Participant.findById(req.user.id).populate('followedClubs');
    const Event = require('../models/Event');
    const Organizer = require('../models/Organizer');
    
    // Show both Published and Ongoing events (like browse endpoint)
    let query = { status: { $in: ['Published', 'Ongoing'] } };
    
    // Filter by interests if set
    if (participant.interests && participant.interests.length > 0) {
      // Get organizers matching participant interests
      const matchingOrganizers = await Organizer.find({ 
        category: { $in: participant.interests },
        isApproved: true 
      });
      
      const organizerIds = matchingOrganizers.map(org => org._id);
      
      // Get events from followed clubs and interest-matching organizers
      const followedOrgIds = participant.followedClubs.map(club => club._id);
      const allOrgIds = [...new Set([...organizerIds, ...followedOrgIds])];
      
      query.organizerId = { $in: allOrgIds };
    } else if (participant.followedClubs && participant.followedClubs.length > 0) {
      // Just show events from followed clubs
      query.organizerId = { $in: participant.followedClubs.map(club => club._id) };
    }
    // If no interests and no followed clubs, show ALL published/ongoing events
    
    const events = await Event.find(query)
      .populate('organizerId')
      .sort({ eventStartDate: 1 })
      .limit(20);
    
    const eventsData = events.map(event => event.toJSON());
    res.json(eventsData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recommended events', error: error.message });
  }
});

module.exports = router;
