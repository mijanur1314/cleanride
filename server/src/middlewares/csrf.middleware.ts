import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AppError } from '../utils/AppError';

export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Bypass CSRF in test environment
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  // Generate a token if it doesn't exist in cookies
  let csrfToken = req.cookies['XSRF-TOKEN'];
  
  if (!csrfToken) {
    const isProd = process.env.NODE_ENV === 'production' || 
                   (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost'));
                   
    csrfToken = crypto.randomBytes(32).toString('hex');
    res.cookie('XSRF-TOKEN', csrfToken, {
      secure: isProd ? true : false,
      sameSite: isProd ? 'none' : 'lax',
      httpOnly: false // Must be false so Axios can read it
    });
  }

  // Allow safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // For mutating methods, verify the token matches the header
  const headerToken = req.headers['x-xsrf-token'];
  if (!headerToken || headerToken !== csrfToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid CSRF token Debug',
      debug: {
        cookies: req.cookies,
        csrfTokenInCookie: csrfToken,
        headerToken: headerToken
      }
    });
  }

  next();
};
