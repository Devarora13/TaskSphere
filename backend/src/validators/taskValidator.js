const { body } = require('express-validator');

exports.createTaskValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title cannot be more than 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot be more than 500 characters'),
  body('status')
    .optional()
    .isIn(['TODO', 'IN_PROGRESS', 'DONE']).withMessage('Status must be TODO, IN_PROGRESS, or DONE'),
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH']).withMessage('Priority must be LOW, MEDIUM, or HIGH'),
  body('dueDate')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Due date must be a valid ISO8601 date')
];

exports.updateTaskValidator = [
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Title cannot be empty')
    .isLength({ max: 100 }).withMessage('Title cannot be more than 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot be more than 500 characters'),
  body('status')
    .optional()
    .isIn(['TODO', 'IN_PROGRESS', 'DONE']).withMessage('Status must be TODO, IN_PROGRESS, or DONE'),
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH']).withMessage('Priority must be LOW, MEDIUM, or HIGH'),
  body('dueDate')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === null || value === '') return true;
      if (isNaN(Date.parse(value))) {
        throw new Error('Due date must be a valid date');
      }
      return true;
    })
];
