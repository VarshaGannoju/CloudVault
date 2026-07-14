const activityModel = require('../models/activityModel');

const logUserActivity = async (userId, action, targetType, targetId, metadata = {}) => {
  return await activityModel.logActivity(userId, action, targetType, targetId, metadata);
};

const getRecentActivities = async (userId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const result = await activityModel.getRecentActivities(userId, limit, offset);
  
  return {
    activities: result.activities,
    pagination: {
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    },
  };
};

module.exports = {
  logUserActivity,
  getRecentActivities,
};
