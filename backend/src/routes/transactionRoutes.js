const express = require('express');
const router = express.Router();
const { getTransactions, createTransaction } = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // all routes below this require authentication
router.route('/').get(getTransactions).post(createTransaction);

module.exports = router;