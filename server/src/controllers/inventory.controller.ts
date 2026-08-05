import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { getIO } from '../socket';

export const getItems = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const items = await prisma.supplyItem.findMany({
    orderBy: { name: 'asc' }
  });
  res.status(200).json({ success: true, data: { items } });
});

const itemSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  stockLevel: z.number().int().min(0)
});

export const addItem = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) return next(new AppError('Invalid input data', 400));

  const item = await prisma.supplyItem.create({
    data: parsed.data
  });
  res.status(201).json({ success: true, data: { item } });
});

export const updateItem = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const parsed = itemSchema.partial().safeParse(req.body);
  if (!parsed.success) return next(new AppError('Invalid input data', 400));

  const item = await prisma.supplyItem.update({
    where: { id: req.params.id as string },
    data: parsed.data
  });
  res.status(200).json({ success: true, data: { item } });
});

export const deleteItem = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // Delete associated requests first to avoid foreign key constraint violation
  await prisma.supplyRequest.deleteMany({
    where: { itemId: req.params.id as string }
  });

  await prisma.supplyItem.delete({
    where: { id: req.params.id as string }
  });
  res.status(204).send();
});

export const requestItem = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { itemId, quantity } = req.body;
  if (!itemId || !quantity || quantity <= 0) {
    return next(new AppError('Please provide a valid item ID and quantity', 400));
  }

  const item = await prisma.supplyItem.findUnique({ where: { id: itemId } });
  if (!item) return next(new AppError('Item not found', 404));

  const request = await prisma.supplyRequest.create({
    data: {
      partnerId: req.user!.id,
      itemId,
      quantity
    },
    include: { item: true }
  });

  res.status(201).json({ success: true, data: { request } });
});

export const getMyRequests = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const requests = await prisma.supplyRequest.findMany({
    where: { partnerId: req.user!.id },
    include: { item: true },
    orderBy: { createdAt: 'desc' }
  });
  res.status(200).json({ success: true, data: { requests } });
});

export const getAllRequests = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const requests = await prisma.supplyRequest.findMany({
    include: { item: true, partner: true },
    orderBy: { createdAt: 'desc' }
  });
  res.status(200).json({ success: true, data: { requests } });
});

export const updateRequestStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { status } = req.body;
  if (!['PENDING', 'APPROVED', 'FULFILLED', 'REJECTED'].includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  const existingRequest = await prisma.supplyRequest.findUnique({
    where: { id: req.params.id as string },
    include: { item: true }
  });

  if (!existingRequest) return next(new AppError('Request not found', 404));

  const updatedRequest = await prisma.$transaction(async (tx) => {
    // If fulfilling, reduce stock
    if (status === 'FULFILLED' && existingRequest.status !== 'FULFILLED') {
      const existingReqItem = (existingRequest as any).item;
      if (existingReqItem.stockLevel < existingRequest.quantity) {
        throw new AppError('Insufficient stock to fulfill request', 400);
      }
      await tx.supplyItem.update({
        where: { id: existingRequest.itemId },
        data: { stockLevel: { decrement: existingRequest.quantity } }
      });
    }
    // If undoing fulfillment, restore stock
    else if (existingRequest.status === 'FULFILLED' && status !== 'FULFILLED') {
      await tx.supplyItem.update({
        where: { id: existingRequest.itemId },
        data: { stockLevel: { increment: existingRequest.quantity } }
      });
    }

    return await tx.supplyRequest.update({
      where: { id: req.params.id as string },
      data: { status },
      include: { item: true, partner: true }
    });
  });

  // Notify partner
  getIO().to(updatedRequest.partnerId).emit('notification', {
    title: 'Supply Request Updated',
    message: `Your request for ${(updatedRequest as any).item.name} is now ${status}.`,
    type: 'info'
  });

  res.status(200).json({ success: true, data: { request: updatedRequest } });
});
