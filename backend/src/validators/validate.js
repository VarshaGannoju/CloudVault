const { validationResult } = require('express-validator');
const { ApiError } = require('../utils/ApiError');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Format errors to a simple message or array
    const extractedErrors = errors.array().map((err) => err.msg);
    throw new ApiError(400, `Validation failed: ${extractedErrors.join(', ')}`);
  }
  next();
};

module.exports = { validate };
