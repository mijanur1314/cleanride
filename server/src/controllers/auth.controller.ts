import { env } from '../utils/env';
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';
import { z } from 'zod';
import crypto from 'crypto';
import { sendEmail } from '../utils/email';

const signToken = (id: string, role: string) => {
  const secret = env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: JWT_SECRET environment variable is not defined.');
  }
  return jwt.sign({ id, role }, secret, {
    expiresIn: (env.JWT_EXPIRES_IN || '90d') as jwt.SignOptions['expiresIn'],
  });
};

import { User } from '@prisma/client';

const createSendToken = (user: User, statusCode: number, res: Response) => {
  const token = signToken(user.id, user.role);

  const { password: _password, ...userWithoutPassword } = user;

  const cookieOptions = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const
  };

  res.cookie('token', token, cookieOptions);

  res.status(statusCode).json({
    success: true,
    data: {
      user: userWithoutPassword,
    },
  });
};

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  role: z.enum(['USER', 'PARTNER']).optional(),
  referredBy: z.string().optional(),
});

export const signup = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const parsed = registerSchema.safeParse(req.body);
  
  if (!parsed.success) {
    return next(new AppError('Invalid input data', 400));
  }

  const { name, email, password, phone, role, referredBy } = parsed.data;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return next(new AppError('Email already in use', 400));
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  
  // Generate random referral code
  const referralCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  let initialPoints = 0;
  
  if (referredBy) {
    const referrer = await prisma.user.findUnique({ where: { referralCode: referredBy } });
    if (referrer) {
      initialPoints = 50; // New user gets 50 points
      
      // Give referrer 50 points
      await prisma.user.update({
        where: { id: referrer.id },
        data: { loyaltyPoints: { increment: 50 } }
      });
    }
  }

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone,
      role: role || 'USER',
      referralCode,
      loyaltyPoints: initialPoints
    },
  });

  createSendToken(newUser, 201, res);
});

export const forgotPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;
  
  if (!email) {
    return next(new AppError('Please provide an email address.', 400));
  }

  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    return next(new AppError('There is no user with that email address.', 404));
  }

  // Generate the random reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  // Set expiry to 1 hour from now
  const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { email },
    data: {
      resetPasswordToken: passwordResetToken,
      resetPasswordExpires: passwordResetExpires,
    },
  });

  const resetURL = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
  const message = `Forgot your password? Submit your new password here: <a href="${resetURL}">${resetURL}</a>. \nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      html: message,
    });
    console.log(`[Email] Password reset link sent: ${resetURL}`);

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    // If email fails, clear the tokens
    await prisma.user.update({
      where: { email },
      data: {
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return next(new AppError('There was an error sending the email. Try again later!', 500));
  }
});

export const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return next(new AppError('Please provide a new password.', 400));
  }

  const tokenStr = Array.isArray(token) ? token[0] : (token as string);
  const hashedToken = crypto.createHash('sha256').update(tokenStr).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { gt: new Date() },
    },
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });

  res.status(200).json({
    status: 'success',
    message: 'Password reset successful',
  });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const parsed = loginSchema.safeParse(req.body);
  
  if (!parsed.success) {
    return next(new AppError('Please provide email and password', 400));
  }

  const { email, password } = parsed.data;

  // Check if user exists && password is correct
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  if (user.isBanned) {
    return next(new AppError('Your account has been banned. Please contact support.', 403));
  }

  createSendToken(user, 200, res);
});

export const getMe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
  });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const { password: _password, ...userWithoutPassword } = user;

  res.status(200).json({
    success: true,
    data: {
      user: userWithoutPassword,
    },
  });
});

export const logout = (req: Request, res: Response) => {
  res.cookie('token', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const
  });
  res.status(200).json({ status: 'success' });
};
