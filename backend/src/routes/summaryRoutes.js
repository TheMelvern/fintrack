const express = require('express');
const router = express.Router();
const { getSummary } = require('../controllers/summaryController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.route('/').get(getSummary);

module.exports = router;