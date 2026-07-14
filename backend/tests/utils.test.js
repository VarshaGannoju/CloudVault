const ApiError = require('../src/utils/ApiError');
const asyncHandler = require('../src/utils/asyncHandler');

describe('ApiError', () => {
  it('creates a 400 badRequest error with the right shape', () => {
    const err = ApiError.badRequest('Invalid input', [{ field: 'email' }]);
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Invalid input');
    expect(err.errors).toEqual([{ field: 'email' }]);
    expect(err.isOperational).toBe(true);
  });

  it('creates a 401 unauthorized error', () => {
    const err = ApiError.unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Unauthorized');
  });

  it('creates a 404 notFound error', () => {
    const err = ApiError.notFound('User not found');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('User not found');
  });

  it('marks internal errors as non-operational', () => {
    const err = ApiError.internal();
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(false);
  });
});

describe('asyncHandler', () => {
  it('calls next(err) when the wrapped function rejects', async () => {
    const error = new Error('boom');
    const failingFn = async () => {
      throw error;
    };
    const next = jest.fn();

    await asyncHandler(failingFn)({}, {}, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it('does not call next when the wrapped function resolves', async () => {
    const successFn = async (req, res) => {
      res.sent = true;
    };
    const next = jest.fn();
    const res = {};

    await asyncHandler(successFn)({}, res, next);

    expect(res.sent).toBe(true);
    expect(next).not.toHaveBeenCalled();
  });
});
