const transactionModel = require('../models/transactionModel');

const getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const transactions = await transactionModel.getAllTransactions(req.user.id);
    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

const createTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const newTransaction = await transactionModel.addTransaction(req.user.id, req.body);
    res.status(201).json(newTransaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
};

module.exports = { getTransactions, createTransaction };