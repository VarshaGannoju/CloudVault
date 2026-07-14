const request = require('supertest');
const app = require('../src/app');
const shareModel = require('../src/models/shareModel');
const fileModel = require('../src/models/fileModel');

jest.mock('../src/models/shareModel');
jest.mock('../src/models/fileModel');

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

describe('Share Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/share/files/:fileId', () => {
    it('should create a file share', async () => {
      fileModel.getFileById.mockResolvedValueOnce({ id: 'file-1' });
      shareModel.createFileShare.mockResolvedValueOnce({ id: 'share-1', public_token: 'token123' });

      const res = await request(app)
        .post('/api/share/files/file-1')
        .send({ isPublic: true });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.public_token).toBe('token123');
    });

    it('should return 404 if file not found', async () => {
      fileModel.getFileById.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/share/files/file-999')
        .send({ isPublic: true });

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/share/public/files/:token', () => {
    it('should return file info for valid token', async () => {
      shareModel.getFileShareByToken.mockResolvedValueOnce({
        id: 'share-1',
        public_token: 'token123',
        expires_at: null,
      });
      shareModel.incrementFileShareView.mockResolvedValueOnce();

      const res = await request(app).get('/api/share/public/files/token123');

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('share-1');
    });

    it('should return 404 for invalid token', async () => {
      shareModel.getFileShareByToken.mockResolvedValueOnce(null);

      const res = await request(app).get('/api/share/public/files/invalid-token');

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });
  });
});
