# AyosPH - Complete Setup Guide

## Table of Contents
1. [Project Structure](#project-structure)
2. [Prerequisites](#prerequisites)
3. [Supabase Setup](#supabase-setup)
4. [Local Development](#local-development)
5. [Environment Variables](#environment-variables)
6. [Deployment to Vercel](#deployment-to-vercel)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Project Structure

```
ayosph/
├── index.html              # Landing page
├── login.html              # Login page
├── register.html           # Registration page
├── dashboard.html          # Resident dashboard
├── admin.html              # Admin dashboard
│
├── css/
│   ├── style.css          # Main styles
│   ├── auth.css           # Auth page styles
│   └── dashboard.css      # Dashboard styles
│
├── js/
│   ├── supabase.js        # Supabase client
│   ├── utils.js           # Utility functions
│   ├── auth.js            # Auth logic
│   ├── index.js           # Landing page logic
│   ├── dashboard.js       # Resident dashboard logic
│   └── admin.js           # Admin dashboard logic
│
├── SQL_SCHEMA.sql         # Database schema
├── .gitignore            # Git ignore file
├── .env.example          # Environment variables template
├── README.md             # Project documentation
└── package.json          # Node dependencies
```

---

## Prerequisites

Before you begin, ensure you have:

1. **Node.js** (v16+) - [Download](https://nodejs.org)
2. **Git** - [Download](https://git-scm.com)
3. **Supabase Account** - [Sign up](https://supabase.com)
4. **Vercel Account** (for deployment) - [Sign up](https://vercel.com)
5. **GitHub Account** (recommended) - [Sign up](https://github.com)

---

## Supabase Setup

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Enter project name: `ayosph`
5. Create a strong database password
6. Select your region (closest to your users)
7. Click "Create New Project"
8. Wait for the project to initialize (5-10 minutes)

### Step 2: Get Your Credentials

1. Go to Project Settings > API
2. Copy your **Project URL** (keep this safe)
3. Copy your **Anon Public Key** (this is safe to expose in frontend)
4. Copy your **Service Role Key** (keep this safe, never expose in frontend)

Save these values in a secure location.

### Step 3: Set Up Database Schema

1. In Supabase, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `SQL_SCHEMA.sql`
4. Paste into the query editor
5. Click "Run"
6. Wait for execution to complete

### Step 4: Configure Authentication

1. Go to **Authentication > Providers**
2. Enable "Email" provider
3. Go to **Email Templates**
4. Customize the email templates (optional but recommended)
5. Go to **Settings > Auth**
6. Configure these settings:
   - Site URL: Your app URL (http://localhost:3000 for development)
   - Redirect URLs: Add your deployment URL
   - JWT Settings: Keep defaults
7. Save changes

### Step 5: Create Storage Buckets

The SQL schema already creates buckets, but verify:

1. Go to **Storage**
2. Should see `reports` and `avatars` buckets
3. If not present, create them:
   - Click "New Bucket"
   - Name: `reports`, Public: Yes
   - Name: `avatars`, Public: Yes

### Step 6: Set Up RLS Policies

All RLS policies are included in the SQL schema. Verify they're created:

1. Go to **Database > RLS**
2. Click each table to view policies
3. All policies should be enabled

---

## Local Development

### Step 1: Clone or Create Project

```bash
# If using Git
git clone https://github.com/yourusername/ayosph.git
cd ayosph

# Or create a new directory
mkdir ayosph
cd ayosph
```

### Step 2: Create Environment File

```bash
# Copy the example env file
cp .env.example .env.local

# Edit the file with your credentials
# On Windows: Use Notepad
# On Mac/Linux: Use nano or vim
nano .env.local
```

### Step 3: Update Environment Variables

Edit `.env.local` with your Supabase credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here

# Optional
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 4: Update JavaScript Files

Edit `js/supabase.js` to use environment variables (if using a build tool):

```javascript
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
```

Or directly insert your values:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your_anon_key_here';
```

### Step 5: Run Local Server

```bash
# Using Python (Python 3)
python -m http.server 8000

# Or using Node.js with http-server
npm install -g http-server
http-server -p 8000

# Or using Live Server extension in VSCode
# Install extension and click "Go Live"
```

### Step 6: Test the Application

1. Open http://localhost:8000 in your browser
2. Navigate to the landing page
3. Test registration: Click "Get Started"
4. Fill in the registration form
5. You should receive a confirmation email
6. After confirming, you can log in
7. Test admin features (login with admin account or modify user role in Supabase)

---

## Environment Variables

### Development (.env.local)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional
SITE_URL=http://localhost:8000
NODE_ENV=development
```

### Production (Vercel)

Set these in Vercel > Project Settings > Environment Variables:

```
SUPABASE_URL
SUPABASE_ANON_KEY
SITE_URL (your production URL)
```

---

## Deployment to Vercel

### Step 1: Prepare for Deployment

1. Update all hard-coded URLs to use environment variables
2. Test thoroughly on localhost
3. Update SITE_URL in Supabase (Auth > Settings)
4. Commit all changes to Git

### Step 2: Deploy with Vercel

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts:
# - Confirm project name
# - Confirm framework (None)
# - Confirm build directory
# - Add environment variables when prompted
```

#### Option B: Using GitHub Integration

1. Push your code to GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/ayosph.git
git branch -M main
git push -u origin main
```

2. In Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Select your GitHub repository
   - Configure environment variables
   - Click "Deploy"

### Step 3: Post-Deployment

1. Update Supabase Auth Settings:
   - Site URL: Your Vercel URL (https://ayosph.vercel.app)
   - Redirect URLs: Add your Vercel URL with /dashboard

2. Test all features in production:
   - Registration
   - Login
   - Report submission
   - Report viewing
   - Admin features

3. Monitor performance:
   - Vercel Analytics
   - Supabase Monitoring
   - Check error logs

---

## Testing

### Manual Testing Checklist

**Authentication:**
- [ ] Register new account
- [ ] Email confirmation works
- [ ] Login with correct credentials
- [ ] Login fails with wrong credentials
- [ ] Logout works
- [ ] Session persists on page reload
- [ ] Protected pages redirect to login

**Resident Features:**
- [ ] Create report with all fields
- [ ] Upload and preview image
- [ ] Geolocation works
- [ ] Report appears in dashboard
- [ ] Filter reports by status
- [ ] Filter reports by category
- [ ] View report details
- [ ] Modal opens and closes

**Admin Features:**
- [ ] View all reports
- [ ] Filter by status, severity, category
- [ ] Update report status
- [ ] Add remarks
- [ ] Upload proof image
- [ ] View analytics
- [ ] Charts render correctly
- [ ] User management

### Browser Testing

- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

### Device Testing

- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] Landscape mode

---

## Troubleshooting

### Authentication Issues

**Problem**: "Login failed" error
- Check Supabase credentials in js/supabase.js
- Verify email exists in Supabase
- Check email is confirmed
- Review Supabase logs

**Problem**: "Cannot create account"
- Check password meets requirements (8+ chars)
- Verify email format is correct
- Check email is not already registered
- Review Supabase Auth logs

### Database Issues

**Problem**: "Error loading data"
- Verify RLS policies are enabled
- Check SQL schema was run completely
- Verify user role in database
- Check Supabase status page

**Problem**: "Cannot update report"
- Verify user is admin or report owner
- Check report status allows updates
- Review RLS policies

### Deployment Issues

**Problem**: "Environment variables not set"
- Verify all vars in Vercel Settings
- Rebuild and redeploy
- Clear browser cache

**Problem**: "CORS errors"
- Update Supabase site URL
- Check allowed redirect URLs
- Verify API requests use correct headers

### Performance Issues

**Problem**: "Page loads slowly"
- Optimize image sizes (compress before upload)
- Check database query performance
- Use Supabase Monitoring
- Check Vercel Analytics

**Problem**: "Charts not rendering"
- Verify Chart.js library loaded
- Check browser console for errors
- Verify data is being populated
- Check for JavaScript errors

---

## Admin Account Setup

### Create Admin User

1. Register a normal account
2. Go to Supabase > Database > users
3. Find your user row
4. Update the `role` field from 'resident' to 'admin'
5. Log out and log back in
6. You now have admin access

---

## Security Checklist

- [ ] Supabase Service Role Key is never exposed in frontend
- [ ] Environment variables are set in production
- [ ] RLS policies are enabled
- [ ] Database backups are configured
- [ ] HTTPS is enforced
- [ ] CORS is properly configured
- [ ] User inputs are validated
- [ ] Authentication tokens are secure
- [ ] File uploads have size limits
- [ ] Admin features require admin role

---

## Support & Documentation

- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **HTTP Status Codes**: https://httpwg.org/specs/rfc7231.html#status.codes
- **REST API Guide**: https://docs.github.com/en/rest

---

## Next Steps

1. **Customize Design**: Modify colors in CSS variables
2. **Add More Features**: Comments, notifications, etc.
3. **Mobile App**: Build native mobile version
4. **Analytics**: Set up Google Analytics
5. **Monitoring**: Configure error tracking (Sentry, etc.)
6. **Email Notifications**: Set up transactional emails
7. **File Storage**: Optimize image storage and CDN

---

**AyosPH** - Building better communities together! 🏘️
