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

jest.mock('../src/services/activityService', () => ({
  logUserActivity: jest.fn(),
}));

jest.mock('../src/models/userModel', () => ({
  findById: jest.fn(),
  updateStorageUsed: jest.fn(),
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
    it('should move file to trash', async () => {
      const mockFile = { id: 'file-1', owner_id: mockUser.id, cloudinary_public_id: 'public_id', mime_type: 'image/jpeg', original_name: 'test.jpg' };
      db.query
        .mockResolvedValueOnce({ rows: [mockFile] }) // getFileByIdAll
        .mockResolvedValueOnce({ rows: [mockFile] }); // trashFile update

      const res = await request(app).delete('/api/files/file-1');

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('File moved to trash');
      expect(cloudinaryService.deleteFromCloudinary).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/files/:id/permanent-delete', () => {
    it('should permanently delete file', async () => {
      const mockFile = { id: 'file-1', owner_id: mockUser.id, cloudinary_public_id: 'public_id', mime_type: 'image/jpeg', size_bytes: 1024 };
      db.query
        .mockResolvedValueOnce({ rows: [mockFile] }) // getFileByIdIncludingDeleted
        .mockResolvedValueOnce({ rows: [] }) // version rows
        .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // version count
        .mockResolvedValueOnce({ rows: [mockFile] }); // permanentDeleteFile
      cloudinaryService.deleteFromCloudinary.mockResolvedValueOnce();

      const res = await request(app).delete('/api/files/file-1/permanent-delete');

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(cloudinaryService.deleteFromCloudinary).toHaveBeenCalled();
    });
  });
});
