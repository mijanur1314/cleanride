import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';

export const getAddons = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
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
    data: { name, description, price: parseFloat(price) }
  });

  res.status(201).json({ success: true, data: { addon } });
});

export const updateAddon = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { name, description, price, isActive } = req.body;
  
  const data: any = {};
  if (name) data.name = name;
  if (description !== undefined) data.description = description;
  if (price !== undefined) data.price = parseFloat(price);
  if (isActive !== undefined) data.isActive = isActive;

  const addon = await prisma.addon.update({
    where: { id: req.params.id as string },
    data
  });

  res.status(200).json({ success: true, data: { addon } });
});

export const deleteAddon = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  await prisma.addon.delete({
    where: { id: req.params.id as string }
  });

  res.status(204).json({ success: true, data: null });
});
