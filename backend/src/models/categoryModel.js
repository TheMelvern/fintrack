const pool = require('../config/db');

const getAllCategories = async (userId) => {
  const result = await pool.query(
    `SELECT cat_id, cat_name, cat_icon, cat_group, cat_parent, is_default, created_at
     FROM categories 
     WHERE user_id = $1 OR is_default = TRUE
     ORDER BY cat_parent DESC, cat_group, cat_name`,
    [userId]
  );
  return result.rows;
};

const getCategoriesByType = async (userId, type) => {
  const result = await pool.query(
    `SELECT cat_id, cat_name, cat_icon, cat_group, cat_parent
     FROM categories 
     WHERE (user_id = $1 OR is_default = TRUE) AND cat_parent = $2
     ORDER BY cat_group, cat_name`,
    [userId, type]
  );
  return result.rows;
};

const addCustomCategory = async (userId, { cat_name, cat_icon, cat_group, cat_parent }) => {
  const result = await pool.query(
    `INSERT INTO categories (cat_name, cat_icon, cat_group, cat_parent, user_id, is_default)
     VALUES ($1, $2, $3, $4, $5, FALSE)
     RETURNING cat_id, cat_name, cat_icon, cat_group, cat_parent, created_at`,
    [cat_name, cat_icon || 'receipt', cat_group || 'Other', cat_parent, userId]
  );
  return result.rows[0];
};

const updateCustomCategory = async (userId, catId, updates) => {
  const { cat_name, cat_icon, cat_group, cat_parent } = updates;
  const result = await pool.query(
    `UPDATE categories 
     SET cat_name = COALESCE($1, cat_name),
         cat_icon = COALESCE($2, cat_icon),
         cat_group = COALESCE($3, cat_group),
         cat_parent = COALESCE($4, cat_parent)
     WHERE cat_id = $5 AND user_id = $6 AND is_default = FALSE
     RETURNING cat_id, cat_name, cat_icon, cat_group, cat_parent`,
    [cat_name, cat_icon, cat_group, cat_parent, catId, userId]
  );
  return result.rows[0];
};

const deleteCustomCategory = async (userId, catId) => {
  // Check if category is used in any transaction
  const checkResult = await pool.query(
    'SELECT COUNT(*) FROM transactions WHERE category_id = $1',
    [catId]
  );
  if (parseInt(checkResult.rows[0].count) > 0) {
    throw new Error('Cannot delete category that has transactions');
  }
  const result = await pool.query(
    'DELETE FROM categories WHERE cat_id = $1 AND user_id = $2 AND is_default = FALSE RETURNING cat_id',
    [catId, userId]
  );
  return result.rows[0];
};

const getCategoryGroups = async (userId) => {
  const result = await pool.query(
    `SELECT DISTINCT cat_group 
     FROM categories 
     WHERE user_id = $1 OR is_default = TRUE
     ORDER BY cat_group`,
    [userId]
  );
  return result.rows.map(r => r.cat_group);
};

module.exports = {
  getAllCategories,
  getCategoriesByType,
  addCustomCategory,
  updateCustomCategory,
  deleteCustomCategory,
  getCategoryGroups,
};