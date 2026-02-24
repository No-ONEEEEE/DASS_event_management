# 🎫 Event Management System

A comprehensive full-stack event management platform with participant registration, organizer dashboards, admin controls, team-based hackathons, and real-time chat functionality.

## 🌟 Features

### For Participants
- ✅ Browse and search events
- ✅ Register for events (individual or team-based)
- ✅ QR code tickets for check-in
- ✅ Team formation with invite system
- ✅ Real-time team chat with file sharing
- ✅ View registration history
- ✅ Personal dashboard

### For Organizers (Clubs)
- ✅ Create and manage events
- ✅ Track registrations and attendance
- ✅ QR code scanner for check-in
- ✅ Export participant data (CSV)
- ✅ View analytics and insights
- ✅ Password reset workflow via admin
- ✅ Discord webhook integration

### For Admins
- ✅ Manage clubs/organizers
- ✅ Approve/reject password reset requests
- ✅ View platform statistics
- ✅ Monitor all events and registrations

### Advanced Features
- 🏆 **Hackathon Team Registration** (8 marks feature)
  - Team creation with unique invite codes
  - Automatic registration when team is full
  - Team management dashboard
  
- 💬 **Real-time Team Chat** (6 marks feature)
  - Socket.io powered messaging
  - File uploads and sharing
  - Online status indicators
  - Typing indicators
  - Read receipts
  
- 🔑 **Organizer Password Reset Workflow** (6 marks feature)
  - Request submission with reason
  - Admin approval/rejection system
  - Auto-generated secure passwords
  - Request history tracking

## 🛠️ Technology Stack

**Frontend:**
- HTML5, CSS3, JavaScript (Vanilla)
- Socket.io Client
- Responsive Design

**Backend:**
- Node.js + Express.js
- Socket.io (WebSockets)
- JWT Authentication
- Multer (File uploads)

**Database:**
- MongoDB Atlas
- Mongoose ODM

**Deployment:**
- Frontend: Vercel/Netlify
- Backend: Render/Railway
- Database: MongoDB Atlas (Cloud)

## 📁 Project Structure

```
event-management/
├── server/
│   ├── app.js              # Main server file
│   ├── socketHandlers.js   # WebSocket handlers
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   └── middleware/         # Auth middleware
├── views/                  # HTML pages
├── public/
│   ├── config.js          # API configuration
│   └── uploads/           # File uploads
├── package.json
├── .env.example
├── deployment.txt         # Deployment URLs
├── DEPLOYMENT_GUIDE.md    # Detailed guide
└── DEPLOYMENT_QUICK_START.md
```

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- npm/yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/event-management.git
   cd event-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env file**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your MongoDB connection string:
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   PORT=5000
   ```

4. **Start the server**
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

5. **Access the application**
   - Open browser: http://localhost:5000
   - Default admin: admin@admin.com / admin123

## 🌐 Deployment

**See detailed guides:**
- 📖 [Comprehensive Deployment Guide](DEPLOYMENT_GUIDE.md)
- ⚡ [Quick Start Deployment](DEPLOYMENT_QUICK_START.md)

**Quick Steps:**
1. Push code to GitHub
2. Deploy backend to Render
3. Deploy frontend to Vercel
4. Update `deployment.txt` with URLs

## 🔑 Default Credentials

**Admin:**
- Email: admin@admin.com
- Password: admin123

**Test Accounts:**
- Create new participant/organizer accounts via signup

## 📊 Database Collections

- `admins` - System administrators
- `organizers` - Event organizers/clubs
- `participants` - Regular users
- `events` - All events
- `registrations` - Event registrations
- `teams` - Hackathon teams
- `messages` - Team chat messages
- `passwordresetrequests` - Password reset workflow

## 🧪 Testing

### Test Features:
1. **User Flows:**
   - Participant signup → Browse → Register → View ticket
   - Organizer signup → Create event → Scan attendance
   - Admin login → Manage clubs → Password resets

2. **Team Features:**
   - Create team → Invite members → Complete team → Chat

3. **Real-time Features:**
   - Open chat in multiple browsers
   - Send messages → See real-time updates
   - Upload files → Download from other session

## 🐛 Troubleshooting

**Server won't start?**
- Check MongoDB connection string
- Verify all dependencies installed: `npm install`
- Check port 5000 is not in use

**Can't connect to database?**
- Verify MongoDB Atlas IP whitelist (0.0.0.0/0)
- Check connection string in .env
- Ensure database user has proper permissions

**Socket.io not working?**
- Check CORS configuration in server/app.js
- Verify FRONTEND_URL environment variable
- Clear browser cache

## 📝 API Documentation

### Base URL
- Local: `http://localhost:5000/api`
- Production: `https://your-backend.onrender.com/api`

### Main Endpoints

**Authentication:**
- `POST /auth/login` - User login
- `POST /auth/signup/participant` - Participant registration
- `POST /auth/signup/organizer` - Organizer registration

**Events:**
- `GET /events` - List all events
- `GET /events/:id` - Event details
- `POST /organizers/events` - Create event (organizer)

**Registrations:**
- `POST /registrations` - Register for event
- `GET /registrations/my-registrations` - User's registrations

**Teams:**
- `POST /teams` - Create team
- `POST /teams/join` - Join team via code
- `GET /teams/:id` - Team details

**Chat:**
- `GET /chat/team/:teamId/messages` - Chat history
- `POST /chat/team/:teamId/upload` - Upload file

**Admin:**
- `GET /admin/password-reset-requests` - View requests
- `POST /admin/password-reset-requests/:id/approve` - Approve request

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing (bcrypt)
- ✅ Role-based access control
- ✅ CORS protection
- ✅ Input validation
- ✅ Secure file uploads
- ✅ Environment variables for secrets

## 📈 Marking Scheme Implementation

- ✅ **Tier A Feature 1:** Hackathon Team Registration (8 marks)
- ✅ **Tier A Feature 2:** Team Chat with Socket.io (6 marks)
- ✅ **Tier B Feature:** Organizer Password Reset Workflow (6 marks)
- ✅ **Deployment:** Full stack deployed (5 marks)

**Total Advanced Features: 25 marks**

## 🤝 Contributing

This is a university project. Not accepting contributions.

## 📄 License

This project is created for educational purposes.

## 👨‍💻 Author

**Mahanth Reddy**
- Assignment: DASS Assignment 1
- Date: February 2026

## 📞 Support

For issues or questions:
1. Check DEPLOYMENT_GUIDE.md
2. Review troubleshooting section
3. Verify environment variables
4. Check MongoDB Atlas connectivity

---

**🎉 Enjoy using the Event Management System!**
