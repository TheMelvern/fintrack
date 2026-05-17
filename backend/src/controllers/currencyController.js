// src/controllers/currencyController.js
const pool = require('../config/db');

const getCurrencies = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT currency_code, currency_symbol, currency_name FROM currencies WHERE is_active = TRUE ORDER BY currency_code'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch currencies' });
  }
};

module.exports = { getCurrencies };