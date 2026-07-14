const supertest = require('supertest');
const app = require('../src/app');
const request = supertest(app);

// Mock the models
jest.mock('../src/models/userModel', () => ({
  findByEmail: jest.fn(),
  createUser: jest.fn(),
  updateRefreshToken: jest.fn(),
}));

jest.mock('../src/models/tokenModel', () => ({
  createEmailVerificationToken: jest.fn(),
}));

jest.mock('../src/services/emailService', () => ({
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

const userModel = require('../src/models/userModel');

describe('Auth Endpoints', () => {
  it('should register a new user', async () => {
    userModel.findByEmail.mockResolvedValue(null);
    userModel.createUser.mockResolvedValue({
      id: 'uuid-123',
      name: 'Test User',
      email: 'testauth@example.com',
    });

    const res = await request.post('/api/auth/register').send({
      name: 'Test User',
      email: 'testauth@example.com',
      password: 'password123',
    });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('success', true);
  });

  it('should login user and return tokens', async () => {
    const bcrypt = require('bcryptjs');
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

    userModel.findByEmail.mockResolvedValue({
      id: 'uuid-123',
      name: 'Test User',
      email: 'testauth@example.com',
      password_hash: 'hashed',
      role: 'user',
    });

    const res = await request.post('/api/auth/login').send({
      email: 'testauth@example.com',
      password: 'password123',
    });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.headers['set-cookie']).toBeDefined();
  });
});
