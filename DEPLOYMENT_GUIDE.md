# 🚀 Deployment Guide - Event Management System

This guide will help you deploy your Event Management System to production.

## 📋 Prerequisites

- [ ] GitHub account
- [ ] MongoDB Atlas account (free tier available)
- [ ] Render account (for backend) OR Railway/Fly.io
- [ ] Vercel/Netlify account (for frontend)

---

## 🗄️ Step 1: Database Setup (MongoDB Atlas)

### Already Configured! ✅
Your application is already using MongoDB Atlas:
- **Connection String**: `mongodb+srv://Mahanth2107:****@cluster0.b1qr3.mongodb.net/event_management`
- **Database**: `event_management`

### Important Security Steps:
1. **Go to MongoDB Atlas** → https://cloud.mongodb.com
2. **Network Access** → Add IP Address
   - Click "Allow Access from Anywhere" (0.0.0.0/0) for deployment servers
   - OR add specific IPs of your hosting provider
3. **Verify Collections**:
   - admins
   - events
   - organizers
   - participants
   - registrations
   - teams
   - messages
   - passwordresetrequests

---

## 🔧 Step 2: Prepare Your Code

### 2.1 Create .env file for production

Copy `.env.example` and create `.env`:

```bash
MONGO_URI=mongodb+srv://Mahanth2107:YbYCY2AFOixzPu4j@cluster0.b1qr3.mongodb.net/event_management?retryWrites=true&w=majority&appName=Cluster0
PORT=5000
NODE_ENV=production
JWT_SECRET=event_mgmt_super_secret_2026_production_key
FRONTEND_URL=https://your-app.vercel.app
```

### 2.2 Push to GitHub

```bash
# Initialize git if not already done
git init

# Add .gitignore
echo "node_modules/
.env
.DS_Store
*.log" > .gitignore

# Commit your code
git add .
git commit -m "Initial commit - Event Management System"

# Create GitHub repository and push
git remote add origin https://github.com/yourusername/event-management.git
git branch -M main
git push -u origin main
```

---

## 🖥️ Step 3: Backend Deployment (Render)

### Option A: Deploy to Render (Recommended)

1. **Sign up at** https://render.com

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

3. **Configure the Service**:
   ```
   Name: event-management-backend
   Region: Choose closest to you
   Branch: main
   Root Directory: (leave empty)
   Runtime: Node
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```

4. **Add Environment Variables**:
   - Click "Environment" → "Add Environment Variable"
   - Add each variable:
   ```
   MONGO_URI=mongodb+srv://Mahanth2107:YbYCY2AFOixzPu4j@cluster0.b1qr3.mongodb.net/event_management?retryWrites=true&w=majority&appName=Cluster0
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=event_mgmt_super_secret_2026_production_key
   FRONTEND_URL=https://your-app.vercel.app
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - Your backend URL will be: `https://event-management-backend-xxxx.onrender.com`

6. **Test Your API**
   - Visit: `https://your-backend-url.onrender.com/`
   - You should see your index.html or an API response

### Option B: Deploy to Railway

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add environment variables (same as above)
5. Click "Deploy"

---

## 🌐 Step 4: Frontend Deployment (Vercel)

### 4.1 Update API URLs

**BEFORE deploying**, update `public/config.js`:

```javascript
const getApiUrl = () => {
  const hostname = window.location.hostname;
  
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return 'https://your-actual-backend-url.onrender.com/api'; // ← UPDATE THIS
  }
  
  return 'http://localhost:5000/api';
};
```

### 4.2 Deploy to Vercel

1. **Sign up at** https://vercel.com

2. **Install Vercel CLI** (optional):
   ```bash
   npm install -g vercel
   ```

3. **Create vercel.json** in root:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "views/**",
         "use": "@vercel/static"
       },
       {
         "src": "public/**",
         "use": "@vercel/static"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/views/$1"
       }
     ]
   }
   ```

4. **Deploy via Vercel Dashboard**:
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Configure:
     ```
     Framework Preset: Other
     Root Directory: ./
     Output Directory: (leave empty)
     ```
   - Click "Deploy"

5. **Your frontend URL**: `https://your-app.vercel.app`

### Alternative: Deploy to Netlify

1. Go to https://netlify.com
2. Drag and drop your `views/` and `public/` folders
3. Or connect GitHub repository
4. Build settings:
   - Base directory: (leave empty)
   - Publish directory: `views`

---

## 🔗 Step 5: Update deployment.txt

After deployment, update `deployment.txt`:

```
Frontend URL: https://your-app.vercel.app
Backend API URL: https://your-backend.onrender.com/api
```

---

## ✅ Step 6: Test Your Deployment

### Test Checklist:

- [ ] Visit frontend URL - homepage loads
- [ ] Signup → Create participant account
- [ ] Login → Access dashboard
- [ ] Browse events → View event details
- [ ] Register for event → Get QR ticket
- [ ] Organizer signup → Create club
- [ ] Create event → Event appears
- [ ] Admin login → View dashboard
- [ ] Password reset → Request & approve
- [ ] Team creation → Join team
- [ ] Team chat → Send messages
- [ ] File upload in chat → Upload works

---

## 🐛 Troubleshooting

### CORS Errors
Update `server/app.js`:
```javascript
const io = socketIO(server, {
  cors: {
    origin: "https://your-frontend-url.vercel.app",
    methods: ["GET", "POST"]
  }
});
```

### Database Connection Issues
- Check MongoDB Atlas IP whitelist
- Verify MONGO_URI in environment variables
- Check database user permissions

### API Not Working
- Check backend logs in Render dashboard
- Verify all environment variables are set
- Test API endpoints with Postman

### Frontend Not Loading
- Clear browser cache
- Check browser console for errors
- Verify API_URL in config.js is correct

---

## 🔒 Security Checklist

- [ ] Change JWT_SECRET to a strong random string
- [ ] Never commit .env file
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS (automatic on Vercel/Render)
- [ ] Set CORS to specific frontend URL in production
- [ ] MongoDB Atlas IP whitelist configured
- [ ] Remove console.logs from production code

---

## 📊 Monitoring & Maintenance

### Backend (Render)
- Dashboard: https://dashboard.render.com
- View logs, metrics, and deployments
- Auto-deploys on git push

### Frontend (Vercel)
- Dashboard: https://vercel.com/dashboard
- View analytics and deployments
- Auto-deploys on git push

### Database (MongoDB Atlas)
- Monitor: https://cloud.mongodb.com
- Check metrics, performance, and storage

---

## 🎉 You're Done!

Your Event Management System is now live in production!

**Share these URLs**:
- Frontend: `https://your-app.vercel.app`
- Backend API: `https://your-backend.onrender.com/api`

**For Evaluation**: Add these URLs to `deployment.txt`

---

## 📱 Quick Commands

```bash
# Update and redeploy
git add .
git commit -m "Update features"
git push origin main
# Auto-deploys to both frontend and backend!

# View backend logs (Render CLI)
render logs -s event-management-backend

# View frontend logs (Vercel CLI)
vercel logs
```

---

## 🆘 Need Help?

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **Socket.io on Render**: https://render.com/docs/deploy-websockets

Good luck with your deployment! 🚀
