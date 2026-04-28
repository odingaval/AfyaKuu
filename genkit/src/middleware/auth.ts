import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';
import { User } from '../models/user.js';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: string };
    }
  }
}

export const auth = (roles: string[] = []) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get token from header
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ success: false, error: 'No token, authorization denied' });
      }

      // Verify token
      const decoded = authService.verifyToken(token);
      if (!decoded) {
        return res.status(401).json({ success: false, error: 'Token is not valid' });
      }

      // Check if user exists
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ success: false, error: 'User not found' });
      }

      // Check role if specified
      if (roles.length > 0 && !roles.includes(decoded.role)) {
        return res.status(403).json({ success: false, error: 'Not authorized to access this route' });
      }

      // Add user to request
      req.user = { id: decoded.id, role: decoded.role };
      next();
    } catch (error) {
      res.status(500).json({ success: false, error: 'Server error' });
    }
  };
};

// Export for testing
export const _auth = { auth };