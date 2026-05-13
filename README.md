# 🎬 ReelGrab – Instagram Reels Downloader

A modern, fast, mobile-friendly Instagram content downloader with a premium SaaS-style UI.

---

## 📁 Folder Structure

```
reelgrab/
├── frontend/                   # Static frontend (HTML/CSS/JS)
│   ├── index.html              # Home page
│   ├── pages/
│   │   ├── about.html
│   │   ├── contact.html
│   │   ├── privacy.html
│   │   └── terms.html
│   └── assets/
│       ├── css/style.css       # All styles (dark/light theme)
│       └── js/main.js          # Frontend logic
│
├── backend/                    # Node.js + Express API
│   ├── server.js               # Main server entry point
│   ├── package.json
│   ├── .env.example            # Environment variable template
│   ├── routes/
│   │   ├── download.js         # POST /api/download (core logic)
│   │   ├── contact.js          # POST /api/contact
│   │   └── admin.js            # GET /api/admin/stats
│   └── utils/
│       └── stats.js            # In-memory analytics
│
├── admin/
│   └── index.html              # Admin dashboard
│
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.8+ (for yt-dlp)
- npm

### 1. Install yt-dlp (required for downloads)
```bash
# macOS/Linux
pip install yt-dlp

# Or via Homebrew
brew install yt-dlp

# Windows
pip install yt-dlp
# Or download yt-dlp.exe and add to PATH
```

### 2. Set up the Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

### 3. Serve the Frontend
Option A – VS Code Live Server (easiest for dev):
- Open `frontend/index.html` in VS Code
- Click "Go Live" in the bottom bar

Option B – Simple HTTP server:
```bash
cd frontend
npx serve .
```

Option C – Deploy to Vercel (see below)

### 4. Access Admin Panel
Open `admin/index.html` in a browser.
Enter the `ADMIN_API_KEY` from your `.env` file.

---

## 🌐 Deployment

### Frontend → Vercel (Free)
1. Push your `frontend/` folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your repo → deploy as static site
4. Set root directory to `frontend`

### Backend → Render (Free tier)
1. Push your `backend/` folder to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add environment variables from `.env`
7. **Also install yt-dlp in Render:**
   - Add build command: `pip install yt-dlp && npm install`

### Backend → Railway
```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
cd backend
railway init
railway up
```

### Environment Variables (Production)
Set these in your hosting platform dashboard:
```
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-site.vercel.app
ADMIN_API_KEY=your_secret_key
```

---

## ⚙️ Configuration

### Connecting Frontend to Backend
In `frontend/assets/js/main.js`, update:
```javascript
const API_BASE_URL = 'https://your-backend.render.com';
```

### Using RapidAPI Instead of yt-dlp
If yt-dlp is hard to install on your hosting, use a managed API:
1. Sign up at [RapidAPI](https://rapidapi.com/search/instagram+downloader)
2. Subscribe to an Instagram Downloader API
3. Add `RAPIDAPI_KEY=your_key` to `.env`
4. Uncomment the `extractWithRapidAPI` function in `routes/download.js`

### Google AdSense
1. Get your Publisher ID from [AdSense](https://adsense.google.com)
2. In `index.html`, uncomment and update:
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_ID" crossorigin="anonymous"></script>
```
3. Replace `ad-placeholder` divs with actual `<ins class="adsbygoogle">` tags

---

## 🔒 Security Best Practices

- ✅ Rate limiting on all endpoints (20 downloads / 15 min per IP)
- ✅ Helmet.js sets secure HTTP headers
- ✅ CORS restricted to your frontend domain
- ✅ URL validation before processing
- ✅ Input length limits (500 chars max)
- ✅ Admin protected by API key
- ✅ No credentials stored
- ✅ HTTPS enforced via hosting provider
- ✅ Request body size limited to 10KB

**Additional recommendations:**
- Add Cloudflare in front for DDoS protection
- Monitor with UptimeRobot or BetterUptime
- Set up log aggregation (Logtail, Papertrail)
- Rotate `ADMIN_API_KEY` regularly

---

## 🔧 API Reference

### POST /api/download
Download Instagram media.

**Request:**
```json
{ "url": "https://www.instagram.com/reel/ABC123/" }
```

**Response:**
```json
{
  "type": "video",
  "title": "Amazing Reel",
  "author": "username",
  "thumbnail": "https://...",
  "medias": [
    { "url": "https://...", "quality": "1080p", "ext": "mp4" },
    { "url": "https://...", "quality": "720p", "ext": "mp4" }
  ]
}
```

**Errors:**
- `400` – Invalid URL
- `403` – Private content
- `404` – Content not found
- `429` – Rate limit exceeded
- `500` – Processing error

### GET /api/admin/stats
Returns analytics. Requires `x-admin-key` header.

### GET /health
Server health check.

---

## 📈 Scaling for Production

When you start getting real traffic:

1. **Database** – Replace in-memory stats with MongoDB or PostgreSQL
2. **Queue** – Use BullMQ/Redis for download job queuing
3. **CDN** – Serve frontend via Cloudflare Pages
4. **Cache** – Cache processed URLs for 5 mins to avoid redundant requests
5. **Monitoring** – Add Sentry for error tracking
6. **Logging** – Structured logging with Winston + Logtail

---

## 📝 License

MIT License. Free for personal and commercial use.

---

## ⚠️ Disclaimer

ReelGrab is not affiliated with Instagram or Meta Platforms, Inc.
Use responsibly. Only download content you have permission to access.
Respect copyright and creator rights.
