const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { verifyParticipant } = require('../middleware/auth');
const Team = require('../models/Team');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Participant = require('../models/Participant');

// Create a new team for a hackathon/team event
router.post('/create', verifyParticipant, async (req, res) => {
  try {
    const { eventId, teamName, teamSize } = req.body;

    // Validate event exists and is a team event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!event.isTeamEvent) {
      return res.status(400).json({ message: 'This event is not a team-based event' });
    }

    if (teamSize < event.minTeamSize || teamSize > event.maxTeamSize) {
      return res.status(400).json({ 
        message: `Team size must be between ${event.minTeamSize} and ${event.maxTeamSize}` 
      });
    }

    // Check if user already has a team for this event
    const existingTeam = await Team.findOne({
      eventId,
      $or: [
        { teamLeaderId: req.user.id },
        { 'members.participantId': req.user.id }
      ]
    });

    if (existingTeam) {
      return res.status(400).json({ message: 'You are already part of a team for this event' });
    }

    // Generate unique invite code
    const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    const inviteLink = `${process.env.APP_URL || 'http://localhost:5000'}/team/join/${inviteCode}`;

    const team = new Team({
      eventId,
      teamName,
      teamLeaderId: req.user.id,
      teamSize,
      inviteCode,
      inviteLink,
      members: [],
      status: 'forming'
    });

    await team.save();

    res.status(201).json({
      message: 'Team created successfully',
      team: await team.populate('teamLeaderId', 'firstName lastName email'),
      inviteCode,
      inviteLink
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating team', error: error.message });
  }
});

// Get team details by invite code
router.get('/join/:inviteCode', verifyParticipant, async (req, res) => {
  try {
    const team = await Team.findOne({ inviteCode: req.params.inviteCode })
      .populate('teamLeaderId', 'firstName lastName email')
      .populate('eventId', 'eventName eventStartDate eventEndDate')
      .populate('members.participantId', 'firstName lastName email');

    if (!team) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }

    if (team.status === 'complete' || team.status === 'registered') {
      return res.status(400).json({ message: 'Team is already complete' });
    }

    res.json({ team });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching team', error: error.message });
  }
});

// Join a team using invite code
router.post('/join/:inviteCode', verifyParticipant, async (req, res) => {
  try {
    const team = await Team.findOne({ inviteCode: req.params.inviteCode });

    if (!team) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }

    if (team.status === 'complete' || team.status === 'registered') {
      return res.status(400).json({ message: 'Team is already complete' });
    }

    // Check if user is the team leader
    if (team.teamLeaderId.toString() === req.user.id) {
      return res.status(400).json({ message: 'You are the team leader' });
    }

    // Check if already in team
    const existingMember = team.members.find(m => m.participantId.toString() === req.user.id);
    if (existingMember) {
      if (existingMember.status === 'accepted') {
        return res.status(400).json({ message: 'You have already joined this team' });
      }
      if (existingMember.status === 'pending') {
        return res.status(400).json({ message: 'You already have a pending invitation' });
      }
    }

    // Check if user is already in another team for this event
    const otherTeam = await Team.findOne({
      eventId: team.eventId,
      _id: { $ne: team._id },
      $or: [
        { teamLeaderId: req.user.id },
        { 'members.participantId': req.user.id, 'members.status': { $in: ['accepted', 'pending'] } }
      ]
    });

    if (otherTeam) {
      return res.status(400).json({ message: 'You are already part of another team for this event' });
    }

    // Check if team is full
    const acceptedCount = team.members.filter(m => m.status === 'accepted').length + 1;
    if (acceptedCount >= team.teamSize) {
      return res.status(400).json({ message: 'Team is already full' });
    }

    // Add member to team
    team.members.push({
      participantId: req.user.id,
      status: 'accepted',
      invitedAt: new Date(),
      respondedAt: new Date()
    });

    // Check if team is now complete
    const newAcceptedCount = team.members.filter(m => m.status === 'accepted').length + 1;
    if (newAcceptedCount === team.teamSize) {
      team.status = 'complete';
      team.completedAt = new Date();
      
      // Automatically create registration for the team
      await createTeamRegistration(team);
    }

    await team.save();

    const populatedTeam = await Team.findById(team._id)
      .populate('teamLeaderId', 'firstName lastName email')
      .populate('eventId', 'eventName')
      .populate('members.participantId', 'firstName lastName email');

    res.json({
      message: team.status === 'complete' ? 'Team is now complete! Registration created.' : 'Successfully joined team',
      team: populatedTeam
    });
  } catch (error) {
    res.status(500).json({ message: 'Error joining team', error: error.message });
  }
});

// Get my teams (as leader or member)
router.get('/my-teams', verifyParticipant, async (req, res) => {
  try {
    const teams = await Team.find({
      $or: [
        { teamLeaderId: req.user.id },
        { 'members.participantId': req.user.id }
      ]
    })
      .populate('teamLeaderId', 'firstName lastName email')
      .populate('eventId', 'eventName eventStartDate eventEndDate')
      .populate('members.participantId', 'firstName lastName email')
      .sort('-createdAt');

    res.json({ teams });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teams', error: error.message });
  }
});

// Get team by ID
router.get('/:teamId', verifyParticipant, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId)
      .populate('teamLeaderId', 'firstName lastName email')
      .populate('eventId', 'eventName eventStartDate eventEndDate minTeamSize maxTeamSize')
      .populate('members.participantId', 'firstName lastName email');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is part of the team
    const isLeader = team.teamLeaderId._id.toString() === req.user.id;
    const isMember = team.members.some(m => m.participantId._id.toString() === req.user.id);

    if (!isLeader && !isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ team });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching team', error: error.message });
  }
});

// Remove member from team (team leader only)
router.delete('/:teamId/members/:memberId', verifyParticipant, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.teamLeaderId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only team leader can remove members' });
    }

    if (team.status === 'registered') {
      return res.status(400).json({ message: 'Cannot modify team after registration' });
    }

    team.members = team.members.filter(m => m.participantId.toString() !== req.params.memberId);
    
    if (team.status === 'complete') {
      team.status = 'forming';
    }

    await team.save();

    const populatedTeam = await Team.findById(team._id)
      .populate('teamLeaderId', 'firstName lastName email')
      .populate('members.participantId', 'firstName lastName email');

    res.json({ 
      message: 'Member removed successfully',
      team: populatedTeam
    });
  } catch (error) {
    res.status(500).json({ message: 'Error removing member', error: error.message });
  }
});

// Leave team (member only)
router.post('/:teamId/leave', verifyParticipant, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.teamLeaderId.toString() === req.user.id) {
      return res.status(400).json({ message: 'Team leader cannot leave. Delete the team instead.' });
    }

    if (team.status === 'registered') {
      return res.status(400).json({ message: 'Cannot leave team after registration' });
    }

    team.members = team.members.filter(m => m.participantId.toString() !== req.user.id);
    
    if (team.status === 'complete') {
      team.status = 'forming';
    }

    await team.save();

    res.json({ message: 'Successfully left the team' });
  } catch (error) {
    res.status(500).json({ message: 'Error leaving team', error: error.message });
  }
});

// Delete team (team leader only, only if not registered)
router.delete('/:teamId', verifyParticipant, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.teamLeaderId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only team leader can delete the team' });
    }

    if (team.status === 'registered') {
      return res.status(400).json({ message: 'Cannot delete team after registration' });
    }

    await Team.findByIdAndDelete(req.params.teamId);

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting team', error: error.message });
  }
});

// Helper function to create team registration
async function createTeamRegistration(team) {
  try {
    const event = await Event.findById(team.eventId);
    
    // Collect all team member IDs
    const allMemberIds = [
      team.teamLeaderId,
      ...team.members.filter(m => m.status === 'accepted').map(m => m.participantId)
    ];

    // Get participant details
    const participants = await Participant.find({ _id: { $in: allMemberIds } });

    const teamMembersData = participants.map(p => ({
      name: `${p.firstName} ${p.lastName}`,
      email: p.email,
      rollNumber: p.rollNumber || ''
    }));

    // Generate ticket ID and QR code for the team
    const ticketId = `TKT-${Date.now()}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    const qrCode = `QR-${ticketId}`;

    // Create a single registration for the entire team
    const registration = new Registration({
      participantId: team.teamLeaderId,
      eventId: team.eventId,
      teamName: team.teamName,
      teamMembers: teamMembersData,
      ticketId,
      qrCode,
      status: 'Registered',
      paymentStatus: event.registrationFee > 0 ? 'Pending' : 'Completed'
    });

    await registration.save();

    // Update team with registration ID
    team.registrationId = registration._id;
    team.status = 'registered';
    await team.save();

    // Update event registration count
    event.currentRegistrations += 1;
    await event.save();

    return registration;
  } catch (error) {
    console.error('Error creating team registration:', error);
    throw error;
  }
}

module.exports = router;
