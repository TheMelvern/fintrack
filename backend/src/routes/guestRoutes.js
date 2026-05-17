const express = require('express');
const router = express.Router();
const { initGuest } = require('../controllers/guestController');

router.post('/init', initGuest);

module.exports = router;