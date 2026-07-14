const express = require('express');

const router = express.Router();

const authRoutes = require('./auth.routes');
const profileRoutes = require('./profile.routes');
const folderRoutes = require('./folder.routes');
const fileRoutes = require('./file.routes');

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/folders', folderRoutes);
router.use('/files', fileRoutes);
// router.use('/users', require('./user.routes'));
// router.use('/share', require('./share.routes'));
// router.use('/admin', require('./admin.routes'));

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the CloudVault API',
    version: '1.0.0',
  });
});

module.exports = router;
