import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';

export const getAddons = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const addons = await prisma.addon.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' }
  });

  res.status(200).json({ success: true, results: addons.length, data: { addons } });
});

// Admin only
export const createAddon = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { name, description, price } = req.body;
  if (!name || !price) {
    return next(new AppError('Name and price are required', 400));
  }

  const addon = await prisma.addon.create({
    data: { name, description, price }
  });

  res.status(201).json({ success: true, data: { addon } });
});
