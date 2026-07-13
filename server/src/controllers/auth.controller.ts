import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';
import { z } from 'zod';

const signToken = (id: string, role: string) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: JWT_SECRET environment variable is not defined.');
  }
  return jwt.sign({ id, role }, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '90d') as any,
  });
};

import { User } from '@prisma/client';

const createSendToken = (user: User, statusCode: number, res: Response) => {
  const token = signToken(user.id, user.role);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user,
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

  createSendToken(user, 200, res);
});

export const getMe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  if (user) {
    (user as any).password = undefined;
  }

  res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
});
