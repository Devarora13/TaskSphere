const AppError = require('../utils/appError');

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message
    });
  } else {
    console.error('ERROR 💥', err);
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went wrong on the server.'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = Object.assign(err);
    error.message = err.message;
    
    if (err.name === 'JsonWebTokenError') {
      error = new AppError('Invalid token. Please log in again.', 401);
    }
    if (err.name === 'TokenExpiredError') {
      error = new AppError('Your token has expired! Please log in again.', 401);
    }
    // Prisma unique constraint violation code
    if (err.code === 'P2002') {
      error = new AppError('Email address already in use.', 400);
    }
    // Prisma record not found code
    if (err.code === 'P2025') {
      error = new AppError('Requested record was not found.', 404);
    }

    sendErrorProd(error, res);
  }
};
