const pool = require('../config/db');

const findByEmail = async (email) => {
  const result = await pool.query(
    `SELECT user_id, user_email, user_pwd, user_name, user_SSO_mtd, 
            user_last_login, user_last_logout, created_at, is_guest
     FROM users 
     WHERE user_email = $1`,
    [email]
  );
  return result.rows[0];
};

const findById = async (id) => {
  const result = await pool.query(
    `SELECT user_id, user_email, user_name, user_SSO_mtd, 
            user_last_login, user_last_logout, created_at, is_guest
     FROM users 
     WHERE user_id = $1`,
    [id]
  );
  return result.rows[0];
};

const createUser = async (email, passwordHash, fullName, ssoMethod = 'email', isGuest = false) => {
  let finalSsoMethod = ssoMethod;
  let finalPasswordHash = passwordHash;
  if (isGuest) {
    finalSsoMethod = 'guest';          // null represents guest / no SSO provider
    finalPasswordHash = null;       // no password
  }
  const result = await pool.query(
    `INSERT INTO users (user_email, user_pwd, user_name, user_SSO_mtd, is_guest)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING user_id, user_email, user_name, created_at, is_guest`,
    [email, finalPasswordHash, fullName || '', finalSsoMethod, isGuest]
  );
  return result.rows[0];
};

const updateLastLogin = async (userId) => {
  await pool.query(
    'UPDATE users SET user_last_login = NOW() WHERE user_id = $1',
    [userId]
  );
};

const updateLastLogout = async (userId) => {
  await pool.query(
    'UPDATE users SET user_last_logout = NOW() WHERE user_id = $1',
    [userId]
  );
};

module.exports = { findByEmail, findById, createUser, updateLastLogin, updateLastLogout };