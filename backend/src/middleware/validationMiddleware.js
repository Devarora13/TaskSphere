const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  
  const extractedErrors = [];
  errors.array().forEach(err => {
    const errMsg = err.msg;
    extractedErrors.push(errMsg);
  });

  return res.status(400).json({
    success: false,
    message: 'Validation failed',
    errors: extractedErrors
  });
};

module.exports = validate;
