/**
 * ReelGrab – Backend Server (server.js)
 * Express + yt-dlp integration for Instagram media downloading
 *
 * SETUP:
 *  1. npm install
 *  2. Install yt-dlp: pip install yt-dlp  OR  brew install yt-dlp
 *  3. Copy .env.example to .env and fill in values
 *  4. npm run dev (development) or npm start (production)
 */

require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

// ─── Route Imports ─────────────────────────────────────────
const downloadRoutes = require('./routes/download');
const contactRoutes  = require('./routes/contact');
const adminRoutes    = require('./routes/admin');

// ─── App Init ──────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Security Middleware ───────────────────────────────────
// Helmet sets secure HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow media serving
}));

// CORS – allow only your frontend domain in production
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:5500',   // Live Server (VS Code)
  'http://localhost:5500',
  process.env.FRONTEND_URL,  // Set this to your Vercel URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl, same-origin)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── General Middleware ────────────────────────────────────
app.use(express.json({ limit: '10kb' }));   // Limit body size
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Rate Limiting ─────────────────────────────────────────
// Global rate limit: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait 15 minutes before trying again.' },
});

// Strict rate limit for download endpoint: 20 per 15 mins per IP
const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Download limit reached. Please wait 15 minutes.' },
});

app.use(globalLimiter);

// ─── Routes ────────────────────────────────────────────────
app.use('/api/download', downloadLimiter, downloadRoutes);
app.use('/api/contact',  contactRoutes);
app.use('/api/admin',    adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 Handler ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ─── Global Error Handler ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred.'
      : err.message,
  });
});

// ─── Start Server ──────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   🎬 ReelGrab Backend               ║
  ║   Running on http://localhost:${PORT}  ║
  ║   Mode: ${(process.env.NODE_ENV || 'development').padEnd(10)}               ║
  ╚══════════════════════════════════════╝
  `);
});

module.exports = app;
