const budgetModel = require('../models/budgetModel');

const getBudgets = async (req, res) => {
  const { month } = req.query; // YYYY-MM-DD
  if (!month) return res.status(400).json({ error: 'Month parameter required' });
  try {
    const budgets = await budgetModel.getBudgetsForMonth(req.user.id, month);
    res.json(budgets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
};

const updateBudget = async (req, res) => {
  try {
    const updated = await budgetModel.upsertBudget(req.user.id, req.body);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update budget' });
  }
};

module.exports = { getBudgets, updateBudget };