// utils/logger.js
import api from './axios';

let backendLoggingEnabled = true;
let localLogQueue = [];
let isSending = false;
let isLogging = false; // re‑entrancy guard

// ---------- Helper: decode JWT ----------
const getUserInfoFromToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.id || payload.user_id || null,
      isGuest: payload.isGuest === true,
    };
  } catch (e) {
    console.warn('[Logger] Token decode failed', e);
    return null;
  }
};

// ---------- Get a stable string ID for the session ----------
const getGuestSessionId = () => {
  const userInfo = getUserInfoFromToken();
  if (userInfo?.userId) {
    // Always return a string (userId might be a number)
    return String(userInfo.userId);
  }
  let sessionId = localStorage.getItem('guest_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    localStorage.setItem('guest_session_id', sessionId);
  }
  return sessionId;
};

// ---------- Send to backend (non‑recursive) ----------
const sendToBackend = async (logEntry) => {
  if (!backendLoggingEnabled) return;
  try {
    await api.post('/logs/log-error', logEntry);
  } catch (err) {
    console.warn('[Logger] Failed to send log', err?.message);
    localLogQueue.push(logEntry);
  }
};

// ---------- Process queue ----------
const processLocalQueue = async () => {
  if (isSending || localLogQueue.length === 0) return;
  isSending = true;
  while (localLogQueue.length) {
    const entry = localLogQueue.shift();
    try {
      await api.post('/logs/log-error', entry);
    } catch {
      localLogQueue.unshift(entry);
      break;
    }
  }
  isSending = false;
};

// ---------- Local debug storage ----------
const downloadLogFile = (logEntry) => {
  const logs = JSON.parse(localStorage.getItem('error_logs') || '[]');
  logs.push(logEntry);
  localStorage.setItem('error_logs', JSON.stringify(logs.slice(-50)));
};

// ---------- Main log function (with recursion guard) ----------
const log = async (level, errorType, details = {}) => {
  if (isLogging) {
    console.warn('[Logger] Recursive call, dropping log:', errorType);
    return;
  }
  isLogging = true;

  try {
    const userInfo = getUserInfoFromToken();
    const isGuest = userInfo ? userInfo.isGuest : false;
    const userId = userInfo ? userInfo.userId : null;

    // --- CRITICAL FIX: ensure guest_session_id is a string ---
    let guestSessionId = getGuestSessionId();
    if (typeof guestSessionId !== 'string') {
      guestSessionId = String(guestSessionId);
    }

    const logEntry = {
      error_type: errorType,
      guest_session_id: guestSessionId,
      user_id: userId,
      is_guest: isGuest,
      url: window.location.href,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      level,
      ...details,
    };

    // Console output (safe – no recursion)
    const consoleMsg = `[${level.toUpperCase()}] ${errorType} | Session: ${guestSessionId.substring(0, 15)}...`;
    if (level === 'error') {
      console.error(consoleMsg, details);
    } else {
      console.log(consoleMsg, details);
    }

    // Send to backend (non‑blocking)
    await sendToBackend(logEntry);

    if (level === 'error' && localStorage.getItem('debug_mode') === 'true') {
      downloadLogFile(logEntry);
    }
  } catch (err) {
    // Ultimate fallback – no logger calls
    console.error('[Logger] Internal error:', err);
  } finally {
    isLogging = false;
  }
};

// ---------- Public API ----------
export const logger = {
  info: (errorType, details) => log('info', errorType, details),
  error: (errorType, details) => log('error', errorType, details),
  warn: (errorType, details) => log('warn', errorType, details),
  debug: (errorType, details) => log('debug', errorType, details),

  downloadLocalLogs: () => {
    const logs = JSON.parse(localStorage.getItem('error_logs') || '[]');
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  setBackendLogging: (enabled) => { backendLoggingEnabled = enabled; },
  flushLogs: () => processLocalQueue(),
};

export default logger;