// routes/logRoutes.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { logError } = require('../controllers/logController');
const backendLogger = require('../utils/backendLogger');

// Endpoint for frontend to log errors (POST)
router.post('/log-error', logError);

// Optional: guest activity log (simple)
router.post('/log-guest-activity', (req, res) => {
  const { action, guest_session_id, details } = req.body;
  backendLogger.info(`Guest Activity: ${action}`, { guest_session_id, ...details });
  res.json({ success: true });
});

// Admin endpoints (add auth middleware in production)
router.get('/download-logs', (req, res) => {
  const fileName = req.query.file;
  if (!fileName) return res.status(400).json({ error: 'Missing file parameter' });
  const safePath = path.join(__dirname, '../../logs', path.basename(fileName));
  if (!safePath.startsWith(path.join(__dirname, '../../logs'))) {
    return res.status(403).json({ error: 'Access denied' });
  }
  res.download(safePath);
});

router.get('/list-logs', (req, res) => {
  const logsDir = path.join(__dirname, '../../logs');
  fs.readdir(logsDir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Failed to read logs' });
    const logFiles = files.filter(f => f.endsWith('.log')).map(f => ({
      name: f,
      path: `/api/logs/download-logs?file=${f}`,
    }));
    res.json({ logs: logFiles });
  });
});

module.exports = router;