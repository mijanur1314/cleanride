import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';
import { z } from 'zod';

const serviceSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  duration: z.number().positive(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

export const getServices = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const services = await prisma.service.findMany({
    where: req.user?.role === 'ADMIN' ? {} : { isActive: true },
  });

  res.status(200).json({
    success: true,
    results: services.length,
    data: { services },
  });
});

export const getServiceById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const service = await prisma.service.findUnique({
    where: { id: req.params.id as string },
  });

  if (!service) return next(new AppError('No service found with that ID', 404));

  res.status(200).json({ success: true, data: { service } });
});

export const createService = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const parsed = serviceSchema.safeParse(req.body);
  if (!parsed.success) return next(new AppError('Invalid input data', 400));

  const service = await prisma.service.create({ data: parsed.data });
  res.status(201).json({ success: true, data: { service } });
});

export const updateService = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const parsed = serviceSchema.partial().safeParse(req.body);
  if (!parsed.success) return next(new AppError('Invalid input data', 400));

  const service = await prisma.service.update({
    where: { id: req.params.id as string },
    data: parsed.data,
  });

  res.status(200).json({ success: true, data: { service } });
});

export const deleteService = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  await prisma.service.delete({ where: { id: req.params.id as string } });
  res.status(204).json({ success: true, data: null });
});
