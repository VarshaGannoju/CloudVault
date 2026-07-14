const ApiError = require('../utils/ApiError');

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Not authorized, user not found'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Not authorized, insufficient permissions'));
    }

    next();
  };
};

module.exports = { requireRole };
