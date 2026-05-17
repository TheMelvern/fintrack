const pool = require('../config/db');

// Helper: get currency symbol from the currencies table
const getCurrencySymbol = async (currencyCode) => {
  if (!currencyCode) return '$';
  const result = await pool.query(
    'SELECT currency_symbol FROM currencies WHERE currency_code = $1',
    [currencyCode]
  );
  return result.rows[0]?.currency_symbol || '$';
};

// Get user preferences (including currency symbol)
const getPreferences = async (req, res) => {
  const userId = req.user.id;
  try {
    let result = await pool.query(
      'SELECT preferences FROM user_preferences WHERE user_id = $1',
      [userId]
    );
    let prefs;
    if (result.rows.length === 0) {
      // Create default preferences
      prefs = {
        theme: 'light',
        currency: 'USD',
        notifications: {
          email: true,
          push: true,
          budget_alerts: true,
        },
        security: {
          two_factor: false,
          session_timeout: 30,
        },
      };
      await pool.query(
        'INSERT INTO user_preferences (user_id, preferences) VALUES ($1, $2)',
        [userId, JSON.stringify(prefs)]
      );
    } else {
      prefs = result.rows[0].preferences;
    }

    // Ensure currency field exists (fallback to USD)
    const currencyCode = prefs.currency || 'USD';
    const currencySymbol = await getCurrencySymbol(currencyCode);

    // Return preferences with the symbol
    res.json({
      ...prefs,
      currencySymbol,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
};

// Update user preferences (partial update, returns updated preferences with currency symbol)
const updatePreferences = async (req, res) => {
  const userId = req.user.id;
  const updates = req.body;
  try {
    // Get current preferences
    const current = await pool.query(
      'SELECT preferences FROM user_preferences WHERE user_id = $1',
      [userId]
    );
    let prefs = current.rows[0]?.preferences || {};

    // Merge updates (shallow merge for top-level keys)
    prefs = { ...prefs, ...updates };

    // Deep merge for nested objects if provided
    if (updates.notifications) {
      prefs.notifications = { ...prefs.notifications, ...updates.notifications };
    }
    if (updates.security) {
      prefs.security = { ...prefs.security, ...updates.security };
    }

    // Ensure currency is valid (if provided or already present)
    const currencyCode = prefs.currency || 'USD';
    const currencySymbol = await getCurrencySymbol(currencyCode);

    // Save updated preferences
    await pool.query(
      `INSERT INTO user_preferences (user_id, preferences) 
       VALUES ($1, $2) 
       ON CONFLICT (user_id) 
       DO UPDATE SET preferences = EXCLUDED.preferences`,
      [userId, JSON.stringify(prefs)]
    );

    // Return the updated preferences along with the currency symbol
    res.json({
      ...prefs,
      currencySymbol,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
};

// Get a specific preference (optional, returns raw value)
const getPreference = async (req, res) => {
  const userId = req.user.id;
  const { key } = req.params;
  try {
    const result = await pool.query(
      'SELECT preferences->>$1 as value FROM user_preferences WHERE user_id = $2',
      [key, userId]
    );
    if (result.rows.length === 0) return res.json({ [key]: null });
    res.json({ [key]: result.rows[0].value });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get preference' });
  }
};

module.exports = { getPreferences, updatePreferences, getPreference };