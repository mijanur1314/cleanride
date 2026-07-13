import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';

export const getUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  });

  res.status(200).json({
    success: true,
    results: users.length,
    data: {
      users,
    },
  });
});

export const getUserById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  if (req.user!.role !== 'ADMIN' && req.user!.id !== req.params.id) {
    return next(new AppError('Unauthorized access to user profile', 403));
  }

  const user = await prisma.user.findUnique({
    where: { id: req.params.id as string },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      bookings: true,
    },
  });

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
});

export const updateProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // Prevent role or password update via this route
  if (req.body.password || req.body.role) {
    return next(new AppError('This route is not for password or role updates.', 400));
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      name: req.body.name,
      phone: req.body.phone,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    },
  });

  res.status(200).json({
    success: true,
    data: {
      user: updatedUser,
    },
  });
});

export const deleteUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  await prisma.user.delete({
    where: { id: req.params.id as string },
  });

  res.status(204).json({
    success: true,
    data: null,
  });
});
