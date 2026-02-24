const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Participant = require('../models/Participant');
const Organizer = require('../models/Organizer');
const Admin = require('../models/Admin');

// Participant Signup
router.post('/participant/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password, participantType, collegeName, contactNumber, isIIITStudent } = req.body;
    
    // Validate IIIT email domain if marked as IIIT student
    if (isIIITStudent) {
      const iiitDomains = ['@iiit.ac.in', '@students.iiit.ac.in', '@research.iiit.ac.in'];
      const isValidIIITEmail = iiitDomains.some(domain => email.toLowerCase().endsWith(domain));
      
      if (!isValidIIITEmail) {
        return res.status(400).json({ 
          message: 'IIIT participants must register using an IIIT-issued email ID (domain: @iiit.ac.in, @students.iiit.ac.in, or @research.iiit.ac.in)' 
        });
      }
    }
    
    const existingParticipant = await Participant.findOne({ email });
    if (existingParticipant) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const participant = new Participant({
      firstName,
      lastName,
      email,
      password,
      participantType,
      collegeName,
      contactNumber,
      isIIITStudent: isIIITStudent || false
    });

    await participant.save();
    
    res.status(201).json({ 
      message: 'Registration successful! Please login with your credentials.',
      success: true,
      participant: {
        id: participant._id,
        email: participant.email,
        firstName: participant.firstName,
        lastName: participant.lastName
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error registering participant', error: error.message });
  }
});

// Participant Login
router.post('/participant/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const participant = await Participant.findOne({ email });
    if (!participant) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await participant.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: participant._id, type: 'participant' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    req.session.userId = participant._id;
    req.session.userType = 'participant';
    
    res.json({ 
      message: 'Login successful', 
      token, 
      userType: 'participant',
      user: {
        id: participant._id,
        email: participant.email,
        firstName: participant.firstName,
        lastName: participant.lastName,
        participantType: participant.participantType,
        collegeName: participant.collegeName,
        contactNumber: participant.contactNumber,
        isIIITStudent: participant.isIIITStudent,
        hasCompletedOnboarding: participant.hasCompletedOnboarding
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login error', error: error.message });
  }
});

// Organizer Signup - DISABLED: Organizers are created by Admin only
// No self-registration allowed per requirements
router.post('/organizer/signup', async (req, res) => {
  return res.status(403).json({ 
    message: 'Organizer self-registration is disabled. Please contact Admin to create your account.' 
  });
});

// Organizer Login
router.post('/organizer/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const organizer = await Organizer.findOne({ email });
    if (!organizer) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!organizer.isApproved) {
      return res.status(403).json({ message: 'Account not approved by admin yet' });
    }

    const isPasswordValid = await organizer.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: organizer._id, type: 'organizer' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    req.session.userId = organizer._id;
    req.session.userType = 'organizer';
    
    res.json({ 
      message: 'Login successful', 
      token, 
      userType: 'organizer',
      user: {
        id: organizer._id,
        email: organizer.email,
        organizerName: organizer.organizerName,
        category: organizer.category,
        description: organizer.description,
        contactEmail: organizer.contactEmail,
        isApproved: organizer.isApproved
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login error', error: error.message });
  }
});

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin._id, type: 'admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    req.session.userId = admin._id;
    req.session.userType = 'admin';
    
    res.json({ 
      message: 'Login successful', 
      token,
      userType: 'admin',
      user: {
        id: admin._id,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login error', error: error.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
