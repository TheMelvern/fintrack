// models/budgetModel.js
const pool = require('../config/db');

const getBudgetsForMonth = async (userId, month) => {
  try {
    // month should be in 'YYYY-MM-DD' format (first day of month)
    const result = await pool.query(
      `SELECT budget_group_id as id, 
              budget_group_cat_group as category, 
              budget_group_cat_amount as amount, 
              budget_group_cat_remark as remark,
              budget_group_created_date as month
       FROM budget_group
       WHERE budget_group_user_id = $1 
         AND budget_group_created_date = $2`,
      [userId, month]
    );
    return result.rows;
  } catch (err) {
    console.error('Budgets query failed:', err.message);
    return [];
  }
};

const upsertBudget = async (userId, budget) => {
  try {
    const { category, amount, month, remark } = budget;
    // category = group name (e.g., 'Food')
    const result = await pool.query(
      `INSERT INTO budget_group 
        (budget_group_user_id, budget_group_cat_group, budget_group_cat_amount, budget_group_created_date, budget_group_cat_remark)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (budget_group_user_id, budget_group_cat_group, budget_group_created_date) 
       DO UPDATE SET 
         budget_group_cat_amount = EXCLUDED.budget_group_cat_amount,
         budget_group_cat_remark = EXCLUDED.budget_group_cat_remark
       RETURNING 
         budget_group_id as id, 
         budget_group_cat_group as category, 
         budget_group_cat_amount as amount, 
         budget_group_cat_remark as remark,
         budget_group_created_date as month`,
      [userId, category, amount, month, remark || null]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Upsert budget failed:', err.message);
    throw err;
  }
};

module.exports = { getBudgetsForMonth, upsertBudget };