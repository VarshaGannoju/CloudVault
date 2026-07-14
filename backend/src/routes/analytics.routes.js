const express = require('express');
const { requireAuth } = require('../middlewares/authMiddleware');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

router.use(requireAuth);

router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/charts', analyticsController.getAnalyticsCharts);
router.get('/admin', analyticsController.getAdminStats);

module.exports = router;
