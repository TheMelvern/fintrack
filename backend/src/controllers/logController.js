// controllers/logController.js
const jwt = require('jsonwebtoken');
const backendLogger = require('../utils/backendLogger'); // your file logger

const logError = async (req, res) => {
  try {
    const logEntry = req.body;

    let userId = null;
    let isGuest = false;
    let guestSessionId = logEntry.guest_session_id || null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id || decoded.user_id;
        isGuest = decoded.isGuest === true;
        if (isGuest && userId) {
          guestSessionId = String(userId);
        }
      } catch (err) {
        // token invalid – still log raw data
      }
    }

    const enrichedData = {
      ...logEntry,
      resolved_user_id: userId,
      resolved_is_guest: isGuest,
      resolved_guest_session_id: guestSessionId,
      ip: req.ip,
    };

    const level = logEntry.level || 'info';
    const message = `[${logEntry.error_type}] ${logEntry.url}`;
    backendLogger[level](message, enrichedData); // use the file logger

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Failed to store log:', err);
    res.status(500).json({ error: 'Logging failed' });
  }
};

module.exports = { logError };