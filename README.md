# 🏘️ AyosPH — Community Issue Reporting System

<p align="center">
  <strong>A modern, civic-tech web application for reporting and resolving barangay community issues.</strong>
  <br><br>
  Built with vanilla HTML/CSS/JS + Supabase. Deployable on Vercel in minutes.
</p>

---

## ✨ Features

### For Residents
- 📝 Submit community issue reports with photos
- 📍 GPS-powered location detection
- 📊 Track report status in real time
- 💬 Comment thread with officials
- 🔔 Real-time notifications
- 🔍 Filter and search reports

### For Barangay Officials (Admin)
- 📋 Manage all community reports
- 🔄 Update report statuses
- ✅ Proof-of-fix image upload (required before marking "Fixed")
- 📈 Analytics: Charts for category, status, timeline
- 👥 User management and moderation
- 🔔 Real-time new report alerts

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend / Auth | [Supabase](https://supabase.com) |
| Database | PostgreSQL (via Supabase) |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime |
| Charts | [Chart.js](https://www.chartjs.org) |
| Deployment | [Vercel](https://vercel.com) |
| Version Control | Git / GitHub |

---

## 📂 Folder Structure

```
ayosph/
├── index.html            # Landing page
├── login.html            # Login page
├── register.html         # Registration page
├── dashboard.html        # Resident dashboard
├── admin.html            # Admin dashboard
│
├── css/
│   ├── style.css         # Global design system & landing styles
│   ├── auth.css          # Auth (login/register) styles
│   ├── dashboard.css     # Shared dashboard styles
│   └── admin.css         # Admin-specific styles & utility classes
│
├── js/
│   ├── supabase.js       # Supabase client initialization
│   ├── utils.js          # Shared utility functions (toast, format, etc.)
│   ├── auth.js           # Registration & login logic
│   ├── index.js          # Landing page interactions
│   ├── dashboard.js      # Resident dashboard logic
│   ├── reports.js        # Report service, comments, rendering
│   ├── admin.js          # Admin dashboard logic + analytics
│   └── notifications.js  # Notification manager (realtime + polling)
│
├── SQL_SCHEMA.sql        # Complete Supabase schema + RLS policies
├── vercel.json           # Vercel deployment config
├── package.json          # Dev tooling scripts
├── .env.example          # Environment variable template
├── .gitignore            # Git exclusions
├── SETUP.md              # Detailed step-by-step setup guide
└── README.md             # This file
```

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ayosph.git
cd ayosph
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Open the **SQL Editor** and run `SQL_SCHEMA.sql`
3. Go to **Project Settings > API** and copy:
   - Project URL
   - Anon Public Key

### 3. Configure Environment

Open `js/supabase.js` and replace:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your_anon_key_here';
```

### 4. Run Locally

```bash
# With Node
npm install
npm start

# Or with Python 3
python3 -m http.server 8000
```

Open `http://localhost:8000` in your browser.

---

## 🗄️ Database Schema

| Table | Description |
|-------|-------------|
| `users` | User profiles (extends Supabase auth) |
| `reports` | Community issue reports |
| `comments` | Discussion threads per report |
| `notifications` | User notification feed |
| `activity_log` | Admin audit trail |

All tables have **Row Level Security (RLS)** policies enabled.

---

## 🔐 Roles & Access

| Feature | Resident | Admin |
|---------|----------|-------|
| View all reports | ✅ | ✅ |
| Submit reports | ✅ | — |
| Update own report | ✅ (Pending only) | — |
| Update any report | — | ✅ |
| Upload proof images | — | ✅ |
| View analytics | — | ✅ |
| Manage users | — | ✅ |
| Delete reports | ✅ (own, Pending) | ✅ |

---

## 📸 Screenshots

| Page | Description |
|------|-------------|
| Landing | Hero, features, how it works, CTA |
| Login / Register | Clean split-panel auth |
| Resident Dashboard | Stats, recent reports, new report form |
| Admin Dashboard | Full report management + charts |

---

## 📊 Report Statuses

```
Pending → Under Review → In Progress → Fixed
                                    ↘ Rejected
```

Admins **must upload a proof-of-fix image** before marking any report as "Fixed".

---

## 🌐 Deployment to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or connect your GitHub repo at [vercel.com/new](https://vercel.com/new) for automatic CI/CD.

Set environment variables in Vercel:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

---

## 🔔 Realtime Features

- Live status updates via **Supabase Realtime** WebSocket
- Polling fallback every 30 seconds
- Browser push notifications (with permission)
- Notification sound on new alerts

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.  
Free to use, modify, and distribute with attribution.

---

## 🙏 Acknowledgments

- **Supabase** — Backend as a service
- **Chart.js** — Beautiful charts
- **Vercel** — Seamless deployment
- All the barangay officials and residents who inspired this project

---

<p align="center">
  Made with ❤️ for Filipino communities.<br>
  <strong>Ayos ang komunidad natin!</strong>
</p>
