const express = require('express');
const profileController = require('../controllers/profileController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { uploadAvatar } = require('../middlewares/uploadMiddleware');
const { validate } = require('../validators/validate');
const { updateProfileValidator } = require('../validators/profileValidator');

const router = express.Router();

// All profile routes require authentication
router.use(requireAuth);

router.get('/', profileController.getProfile);
router.put('/', updateProfileValidator, validate, profileController.updateProfile);
router.post('/avatar', uploadAvatar.single('avatar'), profileController.uploadAvatar);

module.exports = router;
