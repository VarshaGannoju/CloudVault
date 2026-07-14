const asyncHandler = require('../utils/asyncHandler');
const analyticsService = require('../services/analyticsService');

const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const stats = await analyticsService.getUserDashboardStats(userId);
  res.status(200).json({ success: true, data: stats });
});

const getAnalyticsCharts = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const charts = await analyticsService.getUserAnalyticsCharts(userId);
  res.status(200).json({ success: true, data: charts });
});

const getAdminStats = asyncHandler(async (req, res) => {
  const stats = await analyticsService.getAdminDashboardStats(req.user.role);
  res.status(200).json({ success: true, data: stats });
});

module.exports = {
  getDashboardStats,
  getAnalyticsCharts,
  getAdminStats,
};
