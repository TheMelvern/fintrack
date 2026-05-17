const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getCategories, createCategory, updateCategory, deleteCategory, getDefaultCategories } = require('../controllers/categoryController');

// Public route – must be before `router.use(protect)`
router.get('/default', getDefaultCategories);

// Protected routes
router.use(protect);
router.route('/').get(getCategories).post(createCategory);
router.route('/:id').put(updateCategory).delete(deleteCategory);

module.exports = router;