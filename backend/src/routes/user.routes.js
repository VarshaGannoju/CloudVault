const express = require('express');
const { requireAuth } = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');

const router = express.Router();

router.use(requireAuth);

router.get('/search', userController.searchUsers);

module.exports = router;
