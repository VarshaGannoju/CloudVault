const asyncHandler = require('../utils/asyncHandler');
const activityService = require('../services/activityService');

const getRecentActivities = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page, limit } = req.query;
  const data = await activityService.getRecentActivities(userId, page, limit);
  res.status(200).json({ success: true, data });
});

module.exports = {
  getRecentActivities,
};
