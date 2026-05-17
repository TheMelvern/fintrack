// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { signup, login, logout, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);   
router.put('/me', protect, updateProfile);

module.exports = router;