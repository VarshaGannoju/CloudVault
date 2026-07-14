/**
 * Wraps an async route/controller function so any rejected promise
 * is forwarded to Express's `next(err)` instead of requiring a
 * try/catch block in every controller.
 *
 * Usage: router.get('/', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
