const { body, query } = require('express-validator');

const createFolderSchema = [
  body('name').trim().notEmpty().withMessage('Folder name is required').isLength({ max: 255 }).withMessage('Folder name cannot exceed 255 characters'),
  body('parentId').optional({ nullable: true }).isUUID().withMessage('Parent ID must be a valid UUID'),
];

const updateFolderSchema = [
  body('name').trim().notEmpty().withMessage('Folder name is required').isLength({ max: 255 }).withMessage('Folder name cannot exceed 255 characters'),
];

const getFoldersSchema = [
  query('parentId').optional({ nullable: true }).isUUID().withMessage('Parent ID must be a valid UUID'),
];

module.exports = {
  createFolderSchema,
  updateFolderSchema,
  getFoldersSchema,
};
