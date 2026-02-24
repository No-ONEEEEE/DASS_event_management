# Quick Deployment Checklist

## 🚀 Follow these steps in order:

### 1. GitHub Setup
```bash
git init
git add .
git commit -m "Event Management System - Ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/event-management.git
git push -u origin main
```

### 2. Backend Deployment (Render)

**Go to:** https://render.com

1. Click "New +" → "Web Service"
2. Connect GitHub → Select your repository
3. Settings:
   - **Name:** event-management-api
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

4. Environment Variables (Add these):
   ```
   MONGO_URI=mongodb+srv://Mahanth2107:YbYCY2AFOixzPu4j@cluster0.b1qr3.mongodb.net/event_management?retryWrites=true&w=majority&appName=Cluster0
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=event_mgmt_secret_key_2026_production
   FRONTEND_URL=https://your-app.vercel.app
   ```

5. Click "Create Web Service"
6. **COPY YOUR BACKEND URL:** `https://event-management-api-xxxx.onrender.com`

### 3. Update Frontend Config

**Edit:** `public/config.js`

Replace line 8 with your actual backend URL:
```javascript
return 'https://YOUR-ACTUAL-BACKEND-URL.onrender.com/api';
```

**Commit the change:**
```bash
git add public/config.js
git commit -m "Update backend URL for production"
git push
```

### 4. Frontend Deployment (Vercel)

**Go to:** https://vercel.com

1. Click "New Project"
2. Import your GitHub repository
3. Settings:
   - **Framework Preset:** Other
   - **Root Directory:** ./
   - Leave other settings as default

4. Click "Deploy"
5. **COPY YOUR FRONTEND URL:** `https://your-app.vercel.app`

### 5. Update Backend FRONTEND_URL

**Go back to Render:**
1. Dashboard → Your service → Environment
2. Update `FRONTEND_URL` to your actual Vercel URL
3. Click "Save Changes" (will auto-redeploy)

### 6. Update deployment.txt

**Edit:** `deployment.txt`

Add your actual URLs:
```
Frontend URL: https://your-actual-app.vercel.app
Backend API URL: https://your-actual-backend.onrender.com/api
```

### 7. Test Everything

Visit your frontend URL and test:
- [ ] Homepage loads
- [ ] Signup works
- [ ] Login works
- [ ] Create event
- [ ] Register for event
- [ ] View ticket
- [ ] Team chat
- [ ] Admin features

---

## ⚡ Quick Issues & Fixes

**CORS Error?**
- Make sure FRONTEND_URL in Render matches your Vercel URL exactly

**Can't connect to database?**
- Go to MongoDB Atlas → Network Access → Add 0.0.0.0/0 (allow all)

**API returns 404?**
- Check if backend URL in `config.js` has `/api` at the end

**Socket.io not connecting?**
- Wait 2-3 minutes after Render deployment (cold start)

---

## 📝 Final Submission

1. Commit all changes
2. Push to GitHub
3. Verify both URLs work
4. Submit `deployment.txt` with your actual URLs

**That's it! Your app is deployed! 🎉**
