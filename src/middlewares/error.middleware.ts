import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import multer from 'multer';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.message,
    });
  }

  if (err instanceof multer.MulterError) {
    let message = 'File upload error';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File too large. Maximum size is 5MB per file.';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field.';
    } else {
      message = err.message;
    }
    return res.status(400).json({
      success: false,
      message,
      error: message,
    });
  }

  console.error('Unhandled error:', err);

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
};
