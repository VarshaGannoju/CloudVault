const { body, query } = require('express-validator');

const renameFileSchema = [
  body('name').trim().notEmpty().withMessage('File name is required').isLength({ max: 255 }).withMessage('File name cannot exceed 255 characters'),
];

const getFilesSchema = [
  query('folderId').optional({ nullable: true }).isUUID().withMessage('Folder ID must be a valid UUID'),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

const searchFilesSchema = [
  query('query').trim().notEmpty().withMessage('Search query is required'),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

module.exports = {
  renameFileSchema,
  getFilesSchema,
  searchFilesSchema,
};
