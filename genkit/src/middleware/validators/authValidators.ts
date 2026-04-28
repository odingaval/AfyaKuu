import { body } from 'express-validator';

export const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  body('name')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Name is required'),
  body('email')
    .isEmail()
    .withMessage('Please include a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
];

export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please include a valid email')
    .normalizeEmail(),
  body('password')
    .exists()
    .withMessage('Password is required')
];