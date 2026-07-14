const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

jest.mock('../src/config/db', () => ({
  query: jest.fn(),
}));

jest.mock('../src/services/activityService', () => ({
  logUserActivity: jest.fn(),
}));

const mockUser = {
  id: 'a1b2c3d4-e5f6-7890-1234-56789abcdef0',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user',
};

jest.mock('../src/middlewares/authMiddleware', () => ({
  requireAuth: (req, res, next) => {
    req.user = mockUser;
    next();
  },
}));

describe('Folder Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/folders', () => {
    it('should create a new folder', async () => {
      const mockFolder = { id: 'folder-1', name: 'My Folder', owner_id: mockUser.id };
      db.query.mockResolvedValueOnce({ rows: [mockFolder] });

      const res = await request(app)
        .post('/api/folders')
        .send({ name: 'My Folder' });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockFolder);
    });

    it('should fail if name is empty', async () => {
      const res = await request(app)
        .post('/api/folders')
        .send({ name: '' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/folders', () => {
    it('should return folders', async () => {
      const mockFolders = [{ id: 'folder-1', name: 'My Folder' }];
      db.query.mockResolvedValueOnce({ rows: mockFolders });

      const res = await request(app).get('/api/folders');

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(mockFolders);
    });
  });
});
