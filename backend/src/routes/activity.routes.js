const express = require('express');
const { requireAuth } = require('../middlewares/authMiddleware');
const activityController = require('../controllers/activityController');

const router = express.Router();

router.use(requireAuth);

router.get('/', activityController.getRecentActivities);

module.exports = router;
