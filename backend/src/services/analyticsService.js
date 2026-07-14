const analyticsModel = require('../models/analyticsModel');
const activityModel = require('../models/activityModel');
const { ApiError } = require('../utils/ApiError');

const getUserDashboardStats = async (userId) => {
  const storageStats = await analyticsModel.getUserStorageStats(userId);
  const folderStats = await analyticsModel.getUserFolderStats(userId);
  const fileStats = await analyticsModel.getUserFileStatsByType(userId);
  
  const recentUploads = await activityModel.getRecentUploads(userId, 5);
  const recentDownloads = await activityModel.getRecentDownloads(userId, 5);

  let totalFiles = 0;
  fileStats.forEach(stat => {
    totalFiles += parseInt(stat.count, 10);
  });

  return {
    storage: {
      used: parseInt(storageStats.storage_used_bytes, 10),
      limit: parseInt(storageStats.storage_limit_bytes, 10),
    },
    counts: {
      files: totalFiles,
      folders: parseInt(folderStats.folder_count, 10),
    },
    fileTypes: fileStats,
    recentUploads,
    recentDownloads,
  };
};

const getUserAnalyticsCharts = async (userId) => {
  const uploadsOverTime = await analyticsModel.getUploadsOverTime(userId, 30);
  return {
    uploadsOverTime,
  };
};

const getAdminDashboardStats = async (userRole) => {
  if (userRole !== 'admin') {
    throw new ApiError(403, 'Access denied. Admin only.');
  }
  return await analyticsModel.getAdminSystemStats();
};

module.exports = {
  getUserDashboardStats,
  getUserAnalyticsCharts,
  getAdminDashboardStats,
};
