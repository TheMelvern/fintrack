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

// Detect local IP for logging and CORS
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

// CORS – allow both localhost and network IP
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    `http://${localIp}:5173`,
    'https://fintrack-frontend.vercel.app',
    /\.ngrok\.io$/,
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

// Health check (public)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Start server on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(` - Local:   http://localhost:${PORT}`);
  console.log(` - Network: http://${localIp}:${PORT}`);
});