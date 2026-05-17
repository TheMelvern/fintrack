const categoryModel = require('../models/categoryModel');

// Get default categories (public – no auth)
const getDefaultCategories = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT cat_id, cat_name, cat_icon, cat_group, cat_parent FROM categories WHERE is_default = TRUE ORDER BY cat_parent DESC, cat_group, cat_name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch default categories' });
  }
};

// Get all categories for the authenticated user (default + their own)
const getCategories = async (req, res) => {
  const userId = req.user.id;  // from protect middleware
  try {
    const categories = await categoryModel.getAllCategories(userId);
    console.log(`Fetched ${categories.length} categories for user ${userId}`);
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Create a new custom category
const createCategory = async (req, res) => {
  const userId = req.user.id;
  const { cat_name, cat_icon, cat_group, cat_parent } = req.body;
  if (!cat_name || !cat_parent) {
    return res.status(400).json({ error: 'Category name and parent (expense/income) required' });
  }
  try {
    const newCategory = await categoryModel.addCustomCategory(userId, {
      cat_name,
      cat_icon,
      cat_group,
      cat_parent,
    });
    res.status(201).json(newCategory);
  } catch (err) {
    if (err.code === '23505') { // unique violation
      return res.status(400).json({ error: 'Category name already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

// Update a custom category
const updateCategory = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const updates = req.body;
  try {
    const updated = await categoryModel.updateCustomCategory(userId, id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Category not found or not editable' });
    }
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

// Delete a custom category
const deleteCategory = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const deleted = await categoryModel.deleteCustomCategory(userId, id);
    if (!deleted) {
      return res.status(404).json({ error: 'Category not found or not deletable' });
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to delete category' });
  }
};

module.exports = {
  getDefaultCategories,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};