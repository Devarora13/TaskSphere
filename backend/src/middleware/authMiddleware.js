const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');

exports.authenticate = (req, res, next) => {
  let token;

  // 1) Read token from Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If token is missing, throw unauthorized error
  if (!token) {
    return next(new AppError('Authentication required. Please log in.', 401));
  }

  // 2) Verify JWT Access Token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user payload to the request object
    req.user = decoded;
    next();
  } catch (err) {
    return next(new AppError('Invalid or expired authentication token.', 401));
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('User not authenticated.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action.', 403)
      );
    }

    next();
  };
};
