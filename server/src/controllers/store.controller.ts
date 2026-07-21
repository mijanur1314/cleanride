import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';
import { z } from 'zod';

const storeSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  isActive: z.boolean().optional(),
});

export const getStores = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const stores = await prisma.store.findMany({
    where: req.user?.role === 'ADMIN' ? {} : { isActive: true },
  });

  res.status(200).json({
    success: true,
    results: stores.length,
    data: { stores },
  });
});

export const getStoreById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const store = await prisma.store.findUnique({
    where: { id: req.params.id as string },
  });

  if (!store) return next(new AppError('No store found with that ID', 404));

  res.status(200).json({ success: true, data: { store } });
});

export const createStore = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const parsed = storeSchema.safeParse(req.body);
  if (!parsed.success) return next(new AppError('Invalid input data', 400));

  const store = await prisma.store.create({ data: parsed.data });
  res.status(201).json({ success: true, data: { store } });
});

export const updateStore = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const parsed = storeSchema.partial().safeParse(req.body);
  if (!parsed.success) return next(new AppError('Invalid input data', 400));

  const store = await prisma.store.update({
    where: { id: req.params.id as string },
    data: parsed.data,
  });

  res.status(200).json({ success: true, data: { store } });
});

export const deleteStore = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  await prisma.store.delete({ where: { id: req.params.id as string } });
  res.status(204).json({ success: true, data: null });
});
