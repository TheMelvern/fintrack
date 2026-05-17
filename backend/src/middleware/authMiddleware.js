const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Fetch user from database using the ID from the token
      const user = await userModel.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      // Attach user object with an 'id' alias for consistency
      req.user = {
        ...user,
        id: user.user_id,   // ensure numeric ID is accessible via req.user.id
      };
      
      next();
    } catch (err) {
      console.error('Auth middleware error:', err.message);
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }
};

module.exports = { protect };