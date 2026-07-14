const supertest = require('supertest');
const app = require('../src/app');
const request = supertest(app);

// Mock the middleware to bypass auth
jest.mock('../src/middlewares/authMiddleware', () => ({
  requireAuth: (req, res, next) => {
    req.user = { id: 'uuid-123', name: 'Profile User', email: 'profile@example.com', role: 'user' };
    next();
  }
}));

// Mock the service
jest.mock('../src/services/profileService', () => ({
  getProfile: jest.fn().mockResolvedValue({
    id: 'uuid-123', name: 'Profile User', email: 'profile@example.com', role: 'user'
  }),
  updateProfile: jest.fn().mockResolvedValue({
    id: 'uuid-123', name: 'Updated Name', email: 'profile@example.com', role: 'user'
  }),
}));

describe('Profile Endpoints', () => {
  it('should fetch user profile', async () => {
    const res = await request.get('/api/profile');
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toHaveProperty('email', 'profile@example.com');
  });

  it('should update user profile', async () => {
    const res = await request.put('/api/profile').send({
      name: 'Updated Name',
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toHaveProperty('name', 'Updated Name');
  });
});
