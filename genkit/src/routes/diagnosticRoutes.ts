// src/routes/diagnosticRoutes.ts
import { Router } from 'express';
import { analyzeDiagnostic, getDiagnosticStatus } from '../controllers/diagnosticController.js';
import { auth } from '../middleware/auth.js';
import { body } from 'express-validator';

const router = Router();

// All diagnostic routes require authentication
router.use(auth(['healthcare_worker', 'admin']));

// POST /api/diagnostic/analyze - Analyze medical image and query
router.post('/analyze', [
  body('query')
    .isString()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Query must be a string between 1 and 1000 characters'),
  body('imageBase64')
    .optional()
    .isString()
    .withMessage('Image must be provided as base64 string'),
], analyzeDiagnostic);

// GET /api/diagnostic/status - Get diagnostic service status
router.get('/status', getDiagnosticStatus);

export default router;
