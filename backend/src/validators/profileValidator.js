const { body } = require('express-validator');

const updateProfileValidator = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 120 }).withMessage('Name cannot exceed 120 characters'),
];

module.exports = {
  updateProfileValidator,
};
