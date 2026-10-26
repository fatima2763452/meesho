const express = require('express');
const { authUser, logoutUser, getMe, getSystemStatus, toggleSecurity } = require('../controllers/authController');
const router = express.Router();

router.post('/login', authUser);
router.post('/logout', logoutUser);
router.get('/me', getMe);
router.get('/system-status', getSystemStatus);
router.post('/toggle-security', toggleSecurity);

module.exports = router;
