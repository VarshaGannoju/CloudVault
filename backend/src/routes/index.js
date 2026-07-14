const express = require('express');

const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/profile', require('./profile.routes'));
// router.use('/users', require('./user.routes'));
// router.use('/folders', require('./folder.routes'));
// router.use('/files', require('./file.routes'));
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
