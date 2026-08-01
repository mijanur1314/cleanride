import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AppError } from '../utils/AppError';

export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Generate a token if it doesn't exist in cookies
  let csrfToken = req.cookies['XSRF-TOKEN'];
  
  if (!csrfToken) {
    csrfToken = crypto.randomBytes(32).toString('hex');
    res.cookie('XSRF-TOKEN', csrfToken, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      httpOnly: false // Must be false so Axios can read it
    });
  }

  // Allow safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // For mutating methods, verify the token matches the header
  // For mutating methods, verify the token matches the header
  const headerToken = req.headers['x-xsrf-token'];
  console.log('CSRF Check:', { method: req.method, path: req.path, cookie: req.cookies['XSRF-TOKEN'], header: headerToken });
  if (!headerToken || headerToken !== csrfToken) {
    return next(new AppError('Invalid CSRF token', 403));
  }

  next();
};
