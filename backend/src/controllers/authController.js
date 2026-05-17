const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const userModel = require('../models/userModel');

const signup = async (req, res) => {
  const { email, password, fullName } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Check if email already taken by a non‑guest user
  const existingUser = await userModel.findByEmail(email);
  if (existingUser && !existingUser.is_guest) {
    return res.status(400).json({ error: 'Email already in use' });
  }

  // Extract guestId from the Authorization header (if present)
  let guestId = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.isGuest) guestId = decoded.id;
    } catch (err) {
      // token may be invalid – ignore
    }
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  let newUserId;
  let newUser;

  if (guestId) {
    // Convert the guest account to a permanent user
    const updateResult = await pool.query(
      `UPDATE users
       SET user_email = $1,
           user_pwd = $2,
           user_name = $3,
           is_guest = FALSE
       WHERE user_id = $4 AND is_guest = TRUE
       RETURNING user_id, user_email, user_name, created_at`,
      [email, passwordHash, fullName || '', guestId]
    );
    if (updateResult.rows.length === 0) {
      // Guest not found or not a guest – fallback to creating a new user
      const createResult = await userModel.createUser(email, passwordHash, fullName, 'email', false);
      newUserId = createResult.user_id;
      newUser = createResult;
    } else {
      newUserId = updateResult.rows[0].user_id;
      newUser = updateResult.rows[0];
    }
  } else {
    // No guest – create a brand new user
    newUser = await userModel.createUser(email, passwordHash, fullName, 'email', false);
    newUserId = newUser.user_id;
  }

  // Insert default preferences only if not already present (to avoid conflict)
  const prefCheck = await pool.query(
    'SELECT 1 FROM user_preferences WHERE user_id = $1',
    [newUserId]
  );
  if (prefCheck.rows.length === 0) {
    const defaultPreferences = {
      theme: 'light',
      currency: 'USD',
      notifications: { email: true, push: true, budget_alerts: true },
      security: { two_factor: false, session_timeout: 30 },
    };
    await pool.query(
      `INSERT INTO user_preferences (user_id, preferences) VALUES ($1, $2)`,
      [newUserId, JSON.stringify(defaultPreferences)]
    );
  }

  const token = jwt.sign(
    { id: newUserId, email: newUser.user_email },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  // Update last login time
  await userModel.updateLastLogin(newUserId);

  res.status(201).json({
    token,
    user: {
      id: newUserId,
      email: newUser.user_email,
      name: newUser.user_name,
      createdAt: newUser.created_at,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await userModel.findByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Guest users cannot log in
  if (user.is_guest) {
    return res.status(401).json({ error: 'Guest accounts cannot log in. Please sign up first.' });
  }

  const isMatch = await bcrypt.compare(password, user.user_pwd);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Fetch preferences
  const prefResult = await pool.query(
    `SELECT preferences FROM user_preferences WHERE user_id = $1`,
    [user.user_id]
  );
  const preferences = prefResult.rows[0]?.preferences || {};

  const token = jwt.sign(
    { id: user.user_id, email: user.user_email },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  // Update last login time
  await userModel.updateLastLogin(user.user_id);

  res.json({
    token,
    user: {
      id: user.user_id,
      email: user.user_email,
      name: user.user_name,
      createdAt: user.created_at,
    },
    preferences,
  });
};

const logout = async (req, res) => {
  const userId = req.user.id;
  await userModel.updateLastLogout(userId);
  res.json({ message: 'Logged out successfully' });
};

// ========== NEW: Get current user profile ==========
const getMe = async (req, res) => {
  try {
    const user = req.user; // set by protect middleware
    res.json({
      id: user.user_id,
      email: user.user_email,
      name: user.user_name,
      createdAt: user.created_at,
      is_guest: user.is_guest,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

// ========== NEW: Update user profile ==========
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { fullName, email } = req.body;

    // Guests cannot edit profile
    if (req.user.is_guest) {
      return res.status(403).json({ error: 'Guest accounts cannot edit profile. Please sign up first.' });
    }

    const updates = [];
    const values = [];

    if (fullName !== undefined && fullName.trim() !== '') {
      updates.push(`user_name = $${updates.length + 1}`);
      values.push(fullName.trim());
    }

    if (email !== undefined && email.trim() !== '') {
      const newEmail = email.trim().toLowerCase();
      // Check if email already taken by another user
      const existing = await pool.query(
        'SELECT user_id FROM users WHERE user_email = $1 AND user_id != $2',
        [newEmail, userId]
      );
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Email already in use' });
      }
      updates.push(`user_email = $${updates.length + 1}`);
      values.push(newEmail);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(userId);
    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE user_id = $${values.length}
      RETURNING user_id, user_email, user_name, created_at, is_guest
    `;
    const result = await pool.query(query, values);
    const updatedUser = result.rows[0];

    res.json({
      id: updatedUser.user_id,
      email: updatedUser.user_email,
      name: updatedUser.user_name,
      createdAt: updatedUser.created_at,
      is_guest: updatedUser.is_guest,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

module.exports = { signup, login, logout, getMe, updateProfile };