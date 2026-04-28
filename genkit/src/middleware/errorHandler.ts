import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation Error',
      details: err.message 
    });
  }

  // Handle mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      error: 'Duplicate field',
      field,
      message: `${field} already exists`
    });
  }

  // Default to 500 server error
  return res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};