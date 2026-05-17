// controllers/summaryController.js
const pool = require('../config/db');

const getSummary = async (req, res) => {
  const userId = req.user.user_id; // use correct property from req.user
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const monthStr = firstDay.toISOString().slice(0, 10); // 'YYYY-MM-DD'

  try {
    // 1. Spending grouped by cat_group (from transactions + categories)
    const spendingByGroup = await pool.query(
      `SELECT c.cat_group, COALESCE(SUM(ABS(t.amount)), 0) as spent
       FROM transactions t
       JOIN categories c ON c.cat_id = t.category_id
       WHERE t.user_id = $1 AND t.amount < 0 AND t.transaction_date BETWEEN $2 AND $3
       GROUP BY c.cat_group`,
      [userId, firstDay, lastDay]
    );

    // 2. Budgets from new budget_group table (by group name, per month)
    const budgetsByGroup = await pool.query(
      `SELECT budget_group_cat_group as cat_group, budget_group_cat_amount as budget
       FROM budget_group
       WHERE budget_group_user_id = $1 AND budget_group_created_date = $2`,
      [userId, monthStr]
    );

    // 3. Combine spending and budgets into a single object
    const categorySummary = {};

    // Initialize with budgets
    budgetsByGroup.rows.forEach(row => {
      categorySummary[row.cat_group] = {
        budget: parseFloat(row.budget),
        spent: 0,
      };
    });

    // Add spending data
    spendingByGroup.rows.forEach(row => {
      if (categorySummary[row.cat_group]) {
        categorySummary[row.cat_group].spent = parseFloat(row.spent);
      } else {
        categorySummary[row.cat_group] = {
          budget: 0,
          spent: parseFloat(row.spent),
        };
      }
    });

    // 4. Calculate totals
    const totalBudget = Object.values(categorySummary).reduce((sum, g) => sum + g.budget, 0);
    const totalSpent = Object.values(categorySummary).reduce((sum, g) => sum + g.spent, 0);

    // 5. Get group icons and metadata
    const groupIcons = await pool.query(
      `SELECT DISTINCT ON (cat_group) cat_group, cat_icon, cat_parent
       FROM categories
       WHERE cat_group IS NOT NULL
       ORDER BY cat_group, cat_id`
    );

    // 6. Individual category spending (backward compatibility)
    const categorySpendingResult = await pool.query(
      `SELECT c.cat_name, COALESCE(SUM(ABS(t.amount)), 0) as spent
       FROM transactions t
       JOIN categories c ON c.cat_id = t.category_id
       WHERE t.user_id = $1 AND t.amount < 0 AND t.transaction_date BETWEEN $2 AND $3
       GROUP BY c.cat_name`,
      [userId, firstDay, lastDay]
    );
    
    const individualCategorySpending = {};
    categorySpendingResult.rows.forEach(row => {
      individualCategorySpending[row.cat_name] = parseFloat(row.spent);
    });

    // 7. Return the summary
    res.json({
      remainingBudget: totalBudget - totalSpent,
      totalBudget,
      totalSpent,
      categorySummary,              // Grouped by cat_group
      categorySpending: individualCategorySpending,
      groupIcons: groupIcons.rows,
      month: monthStr,
    });
  } catch (err) {
    console.error('Error in getSummary:', err);
    res.status(500).json({ error: 'Failed to get summary' });
  }
};

module.exports = { getSummary };