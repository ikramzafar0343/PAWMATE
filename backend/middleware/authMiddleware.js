const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        if (process.env.NODE_ENV === 'production') {
          console.error('JWT_SECRET is required in production');
          return res.status(500).json({ message: 'Server misconfiguration' });
        }
      }
      const decoded = jwt.verify(token, secret || 'dev_secret_key_do_not_use_in_prod');

      if (!decoded || !decoded.id) {
        res.status(401).json({ 
          message: 'Invalid token format',
          code: 'TOKEN_INVALID'
        });
        return;
      }

      // Use select() for faster auth lookup - lean() not needed as we may need document methods
      // But we can optimize by selecting only needed fields
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        // User was deleted or doesn't exist - clear token on frontend
        res.status(401).json({ 
          message: 'User not found. Please log in again.',
          code: 'USER_NOT_FOUND'
        });
        return;
      }

      // Ensure user ID is consistently available as both _id and id
      if (!req.user.id && req.user._id) {
        req.user.id = req.user._id.toString();
      }
      if (!req.user._id && req.user.id) {
        req.user._id = req.user.id;
      }

      next();
    } catch (error) {
      // JWT verification failed (expired, invalid, etc.)
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        res.status(401).json({ 
          message: 'Session expired. Please log in again.',
          code: 'TOKEN_INVALID'
        });
        return;
      }
      console.error('Auth error:', error);
      res.status(401).json({ 
        message: 'Not authorized, token failed',
        code: 'AUTH_FAILED'
      });
      return;
    }
  } else {
    res.status(401).json({ 
      message: 'Not authorized, no token',
      code: 'NO_TOKEN'
    });
    return;
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401);
    throw new Error('Not authorized as an admin');
  }
};

const vet = (req, res, next) => {
    if (req.user && (req.user.role === 'vet' || req.user.role === 'admin')) {
      next();
    } else {
      res.status(401);
      throw new Error('Not authorized as a veterinarian');
    }
  };

module.exports = { protect, admin, vet };
