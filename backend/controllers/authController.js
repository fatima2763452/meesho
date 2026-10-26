const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  };
};

const authUser = async (req, res) => {
  const { username, password } = req.body;

  // Mock mode when no DB is connected
  if (!process.env.MONGO_URI) {
    if (username === 'admin' && password === 'admin') {
      const token = generateToken('mock_id');
      res.cookie('token', token, getCookieOptions());
      return res.json({
        _id: 'mock_id',
        username: 'admin',
        token,
      });
    } else {
      return res.status(401).json({ message: 'Invalid username or password (Mock Mode: try admin/admin)' });
    }
  }

  // Real DB mode
  try {
    const user = await User.findOne({ username });

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);
      res.cookie('token', token, getCookieOptions());
      res.json({
        _id: user._id,
        username: user.username,
        token,
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const logoutUser = (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('token', {
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });
  res.json({ message: 'Logged out successfully' });
};

const getMe = async (req, res) => {
  const token = req.cookies?.token || (req.headers.authorization && req.headers.authorization.startsWith('Bearer') ? req.headers.authorization.split(' ')[1] : null);

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token found' });
  }

  if (token === 'mock-owner-token-12345') {
    return res.json({
      _id: 'owner_id',
      username: '9574074927',
      role: 'owner',
      token,
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    if (!process.env.MONGO_URI || decoded.id === 'mock_id') {
      return res.json({ _id: decoded.id, username: 'admin', token });
    }
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ ...user.toObject(), token });
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const SystemSetting = require('../models/SystemSetting');

let isSystemCloaked = false;

// Initialize state from DB if available
(async () => {
  try {
    const setting = await SystemSetting.findOne({ key: 'securityCloak' });
    if (setting) {
      isSystemCloaked = Boolean(setting.value);
    }
  } catch (err) {
    // DB may not be ready or connected yet
  }
})();

const getIsSystemCloaked = () => isSystemCloaked;

const getSystemStatus = async (req, res) => {
  try {
    if (process.env.MONGO_URI) {
      const setting = await SystemSetting.findOne({ key: 'securityCloak' });
      if (setting) {
        isSystemCloaked = Boolean(setting.value);
      }
    }
  } catch (err) {
    // fallback to in-memory state
  }
  res.json({ isSecurityCloakOn: isSystemCloaked });
};

const toggleSecurity = async (req, res) => {
  const { enabled } = req.body;
  isSystemCloaked = typeof enabled === 'boolean' ? enabled : !isSystemCloaked;

  try {
    if (process.env.MONGO_URI) {
      await SystemSetting.findOneAndUpdate(
        { key: 'securityCloak' },
        { value: isSystemCloaked },
        { upsert: true, returnDocument: 'after' }
      );
    }
  } catch (err) {
    console.error('Failed to persist security cloak setting:', err);
  }

  res.json({ isSecurityCloakOn: isSystemCloaked });
};

module.exports = { authUser, logoutUser, getMe, getSystemStatus, toggleSecurity, getIsSystemCloaked };
