import { Request, Response } from 'express';
import { validationResult } from 'express-validator';

import { authService, AuthResponse } from '../services/authService.js';
import { User } from '../models/user.js';

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    try {  // Added missing try block
      console.log('Register request body:', req.body);
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
        return;
      }

      const { username, email, password, name } = req.body;
      const { user, token } = await authService.register(username, email, password, name);
      
      res.status(201).json({
        token,
        user
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },
  
  async login(req: Request, res: Response): Promise<void> {
    try {
      console.log('Login request body:', req.body);
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
        return;
      }

      const { email, password } = req.body;
      const { user, token } = await authService.login(email, password);
      
      res.status(200).json({
        success: true,
        user,
        token
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(401).json({
        success: false,
        error: error.message
      });
    }
  },

  async getMe(req: Request, res: Response): Promise<void> {
    try {
      // Ensure user is authenticated
      if (!req.user || !req.user.id) {
        res.status(401).json({ 
          success: false, 
          error: 'Not authorized' 
        });
        return;
      }

      const user = await User.findById(req.user.id).select('-password');
      if (!user) {
        res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
        return;
      }
      
      res.status(200).json({ 
        success: true, 
        user 
      });
    } catch (error: any) {
      console.error('Get me error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Server error' 
      });
    }
  }
};

export default authController;