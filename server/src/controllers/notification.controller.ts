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

export const subscribeToPush = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ success: false, message: 'Invalid subscription object' });
  }

  // Cast subscription to any to bypass TS cache issues with Prisma
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { pushSubscription: subscription } as any
  });

  res.status(200).json({ success: true, message: 'Subscribed to push notifications' });
});
