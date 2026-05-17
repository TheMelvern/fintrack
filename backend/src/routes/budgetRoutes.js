const express = require('express');
const router = express.Router();
const { getBudgets, updateBudget } = require('../controllers/budgetController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.route('/').get(getBudgets).post(updateBudget);

module.exports = router;