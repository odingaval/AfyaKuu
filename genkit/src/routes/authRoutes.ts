import { Router } from 'express';

import { authController } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';
import { registerValidation, loginValidation } from '../middleware/validators/authValidators.js';

const router = Router();

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', registerValidation, authController.register);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', loginValidation, authController.login);

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth(), authController.getMe);

export default router;