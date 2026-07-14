const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');
const cloudinaryService = require('../src/services/cloudinaryService');

jest.mock('../src/config/db', () => ({
  query: jest.fn(),
}));

jest.mock('../src/services/cloudinaryService', () => ({
  uploadBufferToCloudinary: jest.fn(),
  deleteFromCloudinary: jest.fn(),
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

describe('File Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/files', () => {
    it('should return files', async () => {
      const mockFiles = [{ id: 'file-1', original_name: 'test.jpg' }];
      db.query
        .mockResolvedValueOnce({ rows: mockFiles }) // file rows
        .mockResolvedValueOnce({ rows: [{ count: '1' }] }); // count row

      const res = await request(app).get('/api/files');

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.files).toEqual(mockFiles);
      expect(res.body.pagination.total).toBe(1);
    });
  });

  describe('DELETE /api/files/:id', () => {
    it('should delete file', async () => {
      const mockFile = { id: 'file-1', cloudinary_public_id: 'public_id', mime_type: 'image/jpeg' };
      db.query.mockResolvedValueOnce({ rows: [mockFile] }) // getFileById
              .mockResolvedValueOnce({ rows: [mockFile] }); // deleteFile
      cloudinaryService.deleteFromCloudinary.mockResolvedValueOnce();

      const res = await request(app).delete('/api/files/file-1');

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(cloudinaryService.deleteFromCloudinary).toHaveBeenCalled();
    });
  });
});
