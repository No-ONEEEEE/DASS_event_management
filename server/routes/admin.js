const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../middleware/auth');
const Admin = require('../models/Admin');
const Organizer = require('../models/Organizer');
const Participant = require('../models/Participant');
const Event = require('../models/Event');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const bcrypt = require('bcrypt');

// Admin Dashboard
router.get('/dashboard', verifyAdmin, async (req, res) => {
  try {
    const totalParticipants = await Participant.countDocuments();
    const totalOrganizers = await Organizer.countDocuments();
    const approvedOrganizers = await Organizer.countDocuments({ isApproved: true });
    const pendingOrganizers = await Organizer.countDocuments({ isApproved: false });
    const totalEvents = await Event.countDocuments();

    res.json({
      totalParticipants,
      totalOrganizers,
      approvedOrganizers,
      pendingOrganizers,
      totalEvents
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard', error: error.message });
  }
});

// Get all organizers
router.get('/organizers', verifyAdmin, async (req, res) => {
  try {
    const organizers = await Organizer.find().select('-password');
    res.json(organizers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching organizers', error: error.message });
  }
});

// Get pending organizers
router.get('/organizers/pending', verifyAdmin, async (req, res) => {
  try {
    const organizers = await Organizer.find({ isApproved: false }).select('-password');
    res.json(organizers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pending organizers', error: error.message });
  }
});

// Approve organizer
router.post('/organizers/:organizerId/approve', verifyAdmin, async (req, res) => {
  try {
    const organizer = await Organizer.findByIdAndUpdate(
      req.params.organizerId,
      { isApproved: true },
      { new: true }
    );

    res.json({ message: 'Organizer approved', organizer });
  } catch (error) {
    res.status(500).json({ message: 'Error approving organizer', error: error.message });
  }
});

// Reject/Disable organizer
router.post('/organizers/:organizerId/disable', verifyAdmin, async (req, res) => {
  try {
    const organizer = await Organizer.findByIdAndUpdate(
      req.params.organizerId,
      { isApproved: false },
      { new: true }
    );

    res.json({ message: 'Organizer disabled', organizer });
  } catch (error) {
    res.status(500).json({ message: 'Error disabling organizer', error: error.message });
  }
});

// Delete organizer
router.delete('/organizers/:organizerId', verifyAdmin, async (req, res) => {
  try {
    const { permanent } = req.body;

    if (permanent) {
      await Organizer.findByIdAndDelete(req.params.organizerId);
      res.json({ message: 'Organizer permanently deleted' });
    } else {
      // Archive instead of delete
      await Organizer.findByIdAndUpdate(req.params.organizerId, { isApproved: false });
      res.json({ message: 'Organizer archived' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting organizer', error: error.message });
  }
});

// Create new organizer (admin)
router.post('/organizers/create', verifyAdmin, async (req, res) => {
  try {
    const { organizerName, email, password, category, description, contactEmail } = req.body;

    const existingOrganizer = await Organizer.findOne({ email });
    if (existingOrganizer) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const organizer = new Organizer({
      organizerName,
      email,
      password,
      category,
      description,
      contactEmail,
      isApproved: true // Admin created organizers are auto-approved
    });

    await organizer.save();
    
    // Auto-generated credentials should be shared with organizer
    res.status(201).json({
      message: 'Organizer created successfully',
      credentials: {
        email,
        password // In production, send via email instead
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating organizer', error: error.message });
  }
});

// Get all password reset requests
router.get('/password-reset-requests', verifyAdmin, async (req, res) => {
  try {
    const requests = await PasswordResetRequest.find()
      .populate('organizerId', 'organizerName email category contactEmail')
      .sort({ requestDate: -1 });

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching password reset requests', error: error.message });
  }
});

// Approve password reset request
router.post('/password-reset-requests/:requestId/approve', verifyAdmin, async (req, res) => {
  try {
    const { adminComments } = req.body;
    const request = await PasswordResetRequest.findById(req.params.requestId)
      .populate('organizerId', 'organizerName email');

    if (!request) {
      return res.status(404).json({ message: 'Password reset request not found' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ message: 'This request has already been processed' });
    }

    // Auto-generate new password
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let newPassword = '';
    for (let i = 0; i < 8; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Update organizer's password
    const organizer = await Organizer.findById(request.organizerId._id);
    organizer.password = newPassword; // Will be hashed by pre-save hook
    await organizer.save();

    // Update request
    request.status = 'Approved';
    request.adminComments = adminComments || 'Password reset approved';
    request.processedDate = new Date();
    request.processedBy = req.user.id;
    request.newPassword = newPassword; // Store temporarily for admin to share
    await request.save();

    res.json({ 
      message: 'Password reset request approved',
      newPassword,
      organizerEmail: request.organizerId.email,
      organizerName: request.organizerId.organizerName
    });
  } catch (error) {
    res.status(500).json({ message: 'Error approving password reset request', error: error.message });
  }
});

// Reject password reset request
router.post('/password-reset-requests/:requestId/reject', verifyAdmin, async (req, res) => {
  try {
    const { adminComments } = req.body;
    const request = await PasswordResetRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ message: 'Password reset request not found' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ message: 'This request has already been processed' });
    }

    request.status = 'Rejected';
    request.adminComments = adminComments || 'Password reset request rejected';
    request.processedDate = new Date();
    request.processedBy = req.user.id;
    await request.save();

    res.json({ message: 'Password reset request rejected' });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting password reset request', error: error.message });
  }
});

// Admin profile
router.get('/profile', verifyAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select('-password');
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Change admin password
router.post('/change-password', verifyAdmin, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.user.id);

    const isValid = await admin.comparePassword(oldPassword);
    if (!isValid) {
      return res.status(401).json({ message: 'Old password is incorrect' });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error changing password', error: error.message });
  }
});

// Reset organizer password (admin only)
router.post('/organizers/:id/reset-password', verifyAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const organizer = await Organizer.findById(req.params.id);

    if (!organizer) {
      return res.status(404).json({ message: 'Organizer not found' });
    }

    organizer.password = newPassword;
    await organizer.save();

    res.json({ 
      message: 'Password reset successfully',
      credentials: {
        email: organizer.email,
        password: newPassword // In production, send via email instead
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting password', error: error.message });
  }
});

module.exports = router;
