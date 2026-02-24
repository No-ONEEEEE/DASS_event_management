require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Initialize socket handlers
require('./socketHandlers')(io);

// Database connection
const mongoUri = process.env.MONGO_URI || 'mongodb+srv://Mahanth2107:YbYCY2AFOixzPu4j@cluster0.b1qr3.mongodb.net/event_management?retryWrites=true&w=majority&appName=Cluster0';
console.log('Connecting to MongoDB...');
console.log('URI:', mongoUri.replace(/YbYCY2AFOixzPu4j/, '****'));
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../views')));

// Session middleware
app.use(session({
  secret: process.env.JWT_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Page Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/index.html'));
});

app.get('/auth/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/login.html'));
});

app.get('/auth/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/signup.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/dashboard.html'));
});

app.get('/browse-events', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/browse-events.html'));
});

app.get('/event/:eventId', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/event-details.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/profile.html'));
});

app.get('/onboarding', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/onboarding.html'));
});

app.get('/ticket/:registrationId', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/ticket.html'));
});

// Admin Pages
app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/admin-dashboard.html'));
});

app.get('/admin/manage-clubs', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/admin-manage-clubs.html'));
});

app.get('/admin/password-resets', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/admin-password-resets.html'));
});

// Organizer Pages
app.get('/organizer/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/organizer-dashboard.html'));
});

app.get('/organizer/create-event', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/organizer-create-event.html'));
});

app.get('/organizer/ongoing-events', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/organizer-ongoing-events.html'));
});

app.get('/organizer/event/:eventId', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/organizer-event-detail.html'));
});

app.get('/organizer/profile', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/organizer-profile.html'));
});

app.get('/organizer/attendance/:eventId', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/organizer-attendance-scanner.html'));
});

// Team Pages
app.get('/team/create/:eventId', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/team-create.html'));
});

app.get('/team/join/:inviteCode', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/team-join.html'));
});

app.get('/team/manage/:teamId', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/team-manage.html'));
});

app.get('/my-teams', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/my-teams.html'));
});

app.get('/team/:teamId/chat', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/team-chat.html'));
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/participants', require('./routes/participants'));
app.use('/api/organizers', require('./routes/organizers'));
app.use('/api/events', require('./routes/events'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO initialized`);
});
