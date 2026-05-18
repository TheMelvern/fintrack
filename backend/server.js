require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');

// Import Passport configuration (must be before routes)
require('./src/middleware/passport');

const logRoutes = require('./src/routes/logRoutes');
const preferenceRoutes = require('./src/routes/preferenceRoutes');
const { getCurrencies } = require('./src/controllers/currencyController');
const authRoutes = require('./src/routes/authRoutes');
const oauthRoutes = require('./src/routes/oauthRoutes');
const guestRoutes = require('./src/routes/guestRoutes');
const categoryRoutes = require('./src/routes/categoryRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');
const budgetRoutes = require('./src/routes/budgetRoutes');
const summaryRoutes = require('./src/routes/summaryRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Detect local IP for logging and CORS (optional)
const os = require('os');
const networkInterfaces = os.networkInterfaces();
let localIp = 'localhost';
for (const interfaceName in networkInterfaces) {
  for (const iface of networkInterfaces[interfaceName]) {
    if (iface.family === 'IPv4' && !iface.internal) {
      localIp = iface.address;
      break;
    }
  }
}

// CORS – allow both localhost and network IP, plus production frontend
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    `http://${localIp}:5173`,
    'https://fintrack-frontend.vercel.app',
    /\.ngrok\.io$/,
    /\.vercel\.app$/,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// Session middleware (required for Passport)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set true if using HTTPS
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// ========== Public Routes ==========
app.use('/api/auth', authRoutes);
app.use('/api/auth', oauthRoutes);      // Google OAuth endpoints
app.use('/api/guest', guestRoutes);
app.get('/api/currencies/list', getCurrencies);

// ========== Protected Routes ==========
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/summary', summaryRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/preferences', preferenceRoutes);

// ========== Health check (public) ==========
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// ========== Debug route to test if server is alive ==========
app.get('/api/test', (req, res) => {
  res.json({ alive: true, message: 'Server is running' });
});

// ========== 404 handler for unmatched routes ==========
app.use('*', (req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
});

// ========== Global error handler ==========
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(` - Local:   http://localhost:${PORT}`);
  console.log(` - Network: http://${localIp}:${PORT}`);
  console.log('Registered routes:');
  console.log('  POST /api/guest/init');
  console.log('  POST /api/logs/log-error');
  console.log('  GET  /api/health');
  console.log('  GET  /api/test');
  console.log('  ... and all other API routes');
});