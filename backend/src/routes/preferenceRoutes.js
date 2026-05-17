const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getPreferences, updatePreferences, getPreference } = require('../controllers/preferenceController');

router.use(protect);
router.route('/').get(getPreferences).put(updatePreferences);
router.get('/:key', getPreference);

module.exports = router;