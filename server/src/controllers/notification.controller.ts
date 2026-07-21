import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import prisma from '../utils/prisma';

export const getMyNotifications = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' },
  });
  res.status(200).json({ success: true, data: { notifications } });
});

export const markAsRead = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const _notification = await prisma.notification.updateMany({
    where: { 
      id: req.params.id as string,
      userId: req.user!.id 
    },
    data: { isRead: true }
  });
  res.status(200).json({ success: true });
});

export const markAllAsRead = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, isRead: false },
    data: { isRead: true }
  });
  res.status(200).json({ success: true });
});
