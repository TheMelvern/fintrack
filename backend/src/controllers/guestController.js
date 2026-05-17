const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const userModel = require('../models/userModel');

const initGuest = async (req, res) => {
  console.log('➡️ Guest creation started');
  try {
    const guestId = uuidv4();
    const guestEmail = `guest_${guestId}@temp.fintrack.com`;
    const guestName = 'Guest User';
    const dummyPasswordHash = '';

    console.log('1️⃣ Calling userModel.createUser...');
    const newUser = await userModel.createUser(guestEmail, null, guestName, 'email', true);
    console.log('✅ User created:', newUser);

    console.log('2️⃣ Inserting default preferences...');
    const defaultPreferences = {
      theme: 'light',
      currency: 'USD',
      notifications: { email: true, push: true, budget_alerts: true },
      security: { two_factor: false, session_timeout: 30 },
    };
    await pool.query(
      `INSERT INTO user_preferences (user_id, preferences) VALUES ($1, $2)`,
      [newUser.user_id, JSON.stringify(defaultPreferences)]
    );
    console.log('✅ Preferences inserted');

    console.log('3️⃣ Generating JWT with isGuest: true...');
    const token = jwt.sign(
      { id: newUser.user_id, email: newUser.user_email, isGuest: true },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log('✅ Guest session successful');
    res.status(201).json({ token, user: newUser });
  } catch (err) {
    console.error('❌ GUEST CREATION FAILED:', err);
    res.status(500).json({ error: 'Failed to create guest session', details: err.message });
  }
};

module.exports = { initGuest };