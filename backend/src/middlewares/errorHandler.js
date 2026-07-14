const { ApiError } = require('../utils/ApiError');
const { env } = require('../config/env');

/**
 * 404 handler - catches requests that didn't match any route.
 */
function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Global error handler. Must be registered last, after all routes.
 * Converts any thrown/forwarded error into a consistent JSON shape:
 * { success: false, message, errors }
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let error = err;

  if (!(error instanceof ApiError)) {
    // Known library errors get mapped to sane status codes.
    if (error.name === 'ValidationError') {
      error = ApiError.badRequest(error.message);
    } else if (error.code === '23505') {
      // Postgres unique_violation
      error = ApiError.conflict('A record with this value already exists');
    } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      error = ApiError.unauthorized('Invalid or expired token');
    } else {
      error = ApiError.internal(error.message || 'Something went wrong');
    }
  }

  if (!error.isOperational) {
     
    console.error('UNEXPECTED ERROR:', err);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    errors: error.errors || [],
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { notFoundHandler, errorHandler };
