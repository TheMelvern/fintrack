const pool = require('../config/db');

const getAllTransactions = async (userId) => {
  try {
    const result = await pool.query(
      `SELECT id, amount, description, category_id, transaction_date as date, is_recurring 
       FROM transactions 
       WHERE user_id = $1 
       ORDER BY transaction_date DESC`,
      [userId]
    );
    return result.rows;
  } catch (err) {
    console.error('Transaction query failed:', err.message);
    return []; // Return empty array instead of throwing
  }
};

const addTransaction = async (userId, transaction) => {
  try {
    const { amount, description, category_id, transaction_date, is_recurring } = transaction;
    const result = await pool.query(
      `INSERT INTO transactions (user_id, amount, description, category_id, transaction_date, is_recurring)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, amount, description, category_id, transaction_date, is_recurring || false]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Insert transaction failed:', err.message);
    throw err; // Still throw for POST, but at least GET won't break
  }
};

module.exports = { getAllTransactions, addTransaction };