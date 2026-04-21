import { body, param, query, validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

export const registerValidation = [
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate,
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  validate,
];

export const manhwaValidation = [
  body('title').trim().notEmpty().withMessage('Title required'),
  body('synopsis').optional().trim(),
  body('genres').optional().isArray(),
  body('status').optional().isIn(['Ongoing', 'Completed', 'Hiatus', 'Dropped']),
  validate,
];

export const commentValidation = [
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Comment must be 1-2000 characters'),
  validate,
];
