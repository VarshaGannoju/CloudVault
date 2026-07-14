const request = require('supertest');
const app = require('../src/app');
const analyticsModel = require('../src/models/analyticsModel');
const activityModel = require('../src/models/activityModel');

jest.mock('../src/models/analyticsModel');
jest.mock('../src/models/activityModel');

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

describe('Analytics and Activity Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/analytics/dashboard', () => {
    it('should return dashboard stats', async () => {
      analyticsModel.getUserStorageStats.mockResolvedValueOnce({ storage_used_bytes: 100, storage_limit_bytes: 1000 });
      analyticsModel.getUserFolderStats.mockResolvedValueOnce({ folder_count: 5 });
      analyticsModel.getUserFileStatsByType.mockResolvedValueOnce([{ mime_type: 'image/png', count: 2, total_size: 100 }]);
      activityModel.getRecentUploads.mockResolvedValueOnce([]);
      activityModel.getRecentDownloads.mockResolvedValueOnce([]);

      const res = await request(app).get('/api/analytics/dashboard');

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.storage.used).toBe(100);
      expect(res.body.data.counts.folders).toBe(5);
      expect(res.body.data.counts.files).toBe(2);
    });
  });

  describe('GET /api/activities', () => {
    it('should return recent activities', async () => {
      activityModel.getRecentActivities.mockResolvedValueOnce({
        activities: [{ id: 'act-1', action: 'file.upload' }],
        total: 1
      });

      const res = await request(app).get('/api/activities?page=1&limit=10');

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.activities.length).toBe(1);
    });
  });
});
