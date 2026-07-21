import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';
import { z } from 'zod';

const vehicleSchema = z.object({
  type: z.string().min(1),
  make: z.string().optional(),
  model: z.string().optional(),
  plateNumber: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export const addVehicle = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const parsed = vehicleSchema.safeParse(req.body);
  if (!parsed.success) return next(new AppError('Invalid input data', 400));

  const { type, make, model, plateNumber, isDefault } = parsed.data;

  if (isDefault) {
    await prisma.vehicle.updateMany({
      where: { userId: req.user!.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      userId: req.user!.id,
      type: type as string,
      make,
      model,
      plateNumber,
      isDefault: isDefault || false,
    }
  });

  res.status(201).json({ success: true, data: { vehicle } });
});

export const getMyVehicles = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const vehicles = await prisma.vehicle.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' }
  });

  res.status(200).json({ success: true, results: vehicles.length, data: { vehicles } });
});

export const deleteVehicle = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: req.params.id as string }
  });

  if (!vehicle || vehicle.userId !== req.user!.id) {
    return next(new AppError('Vehicle not found', 404));
  }

  await prisma.vehicle.delete({
    where: { id: req.params.id as string }
  });

  res.status(204).json({ success: true, data: null });
});
