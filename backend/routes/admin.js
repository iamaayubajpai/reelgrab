/**
 * routes/admin.js
 * GET /api/admin/stats  – Analytics dashboard data
 *
 * Protected by API key (set ADMIN_API_KEY in .env)
 */

const express = require('express');
const router  = express.Router();
const stats   = require('../utils/stats');

// Middleware: simple API key auth for admin routes
function requireAdminKey(req, res, next) {
  const key = req.headers['x-admin-key'] || req.query.key;

  if (!process.env.ADMIN_API_KEY) {
    return res.status(500).json({ error: 'Admin API key not configured.' });
  }
  if (key !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorised.' });
  }
  next();
}

// GET /api/admin/stats
router.get('/stats', requireAdminKey, (req, res) => {
  res.json({
    downloads:   stats.get('downloads'),
    errors:      stats.get('errors'),
    uptime:      Math.floor(process.uptime()),
    memory:      process.memoryUsage(),
    timestamp:   new Date().toISOString(),
    recentLogs:  stats.getLogs(),
  });
});

// POST /api/admin/reset
router.post('/reset', requireAdminKey, (req, res) => {
  stats.reset();
  res.json({ success: true, message: 'Stats reset.' });
});

module.exports = router;
