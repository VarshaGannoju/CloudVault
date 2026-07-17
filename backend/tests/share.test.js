const request = require('supertest');
const app = require('../src/app');
const shareModel = require('../src/models/shareModel');
const fileModel = require('../src/models/fileModel');
const { isValidPublicToken } = require('../src/utils/shareHelpers');

jest.mock('../src/models/shareModel');
jest.mock('../src/models/fileModel');
jest.mock('../src/models/folderModel', () => ({
  getFolderById: jest.fn(),
  getFolders: jest.fn(),
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

describe('Share Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('shareHelpers', () => {
    it('validates public token format', () => {
      expect(isValidPublicToken('a'.repeat(64))).toBe(true);
      expect(isValidPublicToken('invalid')).toBe(false);
      expect(isValidPublicToken(null)).toBe(false);
    });
  });

  describe('POST /api/share/files/:fileId', () => {
    it('should create a file share', async () => {
      fileModel.getFileByIdAll.mockResolvedValueOnce({ id: 'file-1', owner_id: mockUser.id });
      shareModel.getPublicFileShareByFileId.mockResolvedValueOnce(null);
      shareModel.createFileShare.mockResolvedValueOnce({ id: 'share-1', public_token: 'a'.repeat(64) });

      const res = await request(app)
        .post('/api/share/files/file-1')
        .send({ isPublic: true });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.public_token).toBe('a'.repeat(64));
    });

    it('should reuse an existing public token', async () => {
      const existingShare = { id: 'share-1', public_token: 'b'.repeat(64) };
      fileModel.getFileByIdAll.mockResolvedValueOnce({ id: 'file-1', owner_id: mockUser.id });
      shareModel.getPublicFileShareByFileId.mockResolvedValueOnce(existingShare);

      const res = await request(app)
        .post('/api/share/files/file-1')
        .send({ isPublic: true });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.public_token).toBe(existingShare.public_token);
      expect(shareModel.createFileShare).not.toHaveBeenCalled();
    });

    it('should return 404 if file not found', async () => {
      fileModel.getFileByIdAll.mockResolvedValueOnce(null);

      const res = await request(app)
        .post('/api/share/files/file-999')
        .send({ isPublic: true });

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/share (unified createShare)', () => {
    it('should create a new public share via accessType public', async () => {
      const token = 'e'.repeat(64);
      fileModel.getFileByIdAll.mockResolvedValueOnce({ id: 'file-1', owner_id: mockUser.id });
      shareModel.getPublicFileShareByFileId.mockResolvedValueOnce(null);
      shareModel.createFileShare.mockResolvedValueOnce({ id: 'share-1', public_token: token });

      const res = await request(app)
        .post('/api/share')
        .send({
          itemId: 'file-1',
          itemType: 'file',
          accessType: 'public',
          permission: 'read',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.share.publicToken).toBe(token);
      expect(res.body.share.isPublic).toBe(true);
    });

    it('should reuse existing public token via accessType public', async () => {
      const existingShare = { id: 'share-1', public_token: 'f'.repeat(64) };
      fileModel.getFileByIdAll.mockResolvedValueOnce({ id: 'file-1', owner_id: mockUser.id });
      shareModel.getPublicFileShareByFileId
        .mockResolvedValueOnce(existingShare)
        .mockResolvedValueOnce(existingShare);

      const res = await request(app)
        .post('/api/share')
        .send({
          itemId: 'file-1',
          itemType: 'file',
          accessType: 'public',
          permission: 'read',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.share.publicToken).toBe(existingShare.public_token);
      expect(shareModel.createFileShare).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/share/item/:itemType/:itemId/access', () => {
    it('should return at most one canonical public share', async () => {
      const older = {
        id: 'share-old',
        permission: 'read',
        public_token: 'a'.repeat(64),
        created_at: '2026-01-01T00:00:00Z',
      };
      const newer = {
        id: 'share-new',
        permission: 'read',
        public_token: 'b'.repeat(64),
        created_at: '2026-02-01T00:00:00Z',
      };
      const privateShare = {
        id: 'share-private',
        permission: 'read',
        public_token: null,
        created_at: '2026-03-01T00:00:00Z',
        shared_with_email: 'other@example.com',
      };

      shareModel.getSharesByFileId.mockResolvedValueOnce([newer, older, privateShare]);

      const res = await request(app).get('/api/share/item/file/file-1/access');

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveLength(2);
      const publicShares = res.body.data.filter((s) => s.public_token);
      expect(publicShares).toHaveLength(1);
      expect(publicShares[0].id).toBe('share-old');
    });
  });

  describe('GET /api/share/public/files/:token', () => {
    it('should return file info for valid token', async () => {
      const token = 'c'.repeat(64);
      shareModel.getFileShareByToken.mockResolvedValueOnce({
        id: 'share-1',
        public_token: token,
        expires_at: null,
        original_name: 'test.pdf',
        cloudinary_url: 'https://example.com/file.pdf',
        mime_type: 'application/pdf',
        size_bytes: 1024,
        allow_download: true,
        views: 0,
      });
      shareModel.incrementFileShareView.mockResolvedValueOnce();

      const res = await request(app).get(`/api/share/public/files/${token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('test.pdf');
      expect(res.body.data.id).toBeUndefined();
    });

    it('should return 404 for invalid token', async () => {
      shareModel.getFileShareByToken.mockResolvedValueOnce(null);

      const res = await request(app).get(`/api/share/public/files/${'d'.repeat(64)}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 for malformed token', async () => {
      const res = await request(app).get('/api/share/public/files/short-token');

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(shareModel.getFileShareByToken).not.toHaveBeenCalled();
    });
  });
});
