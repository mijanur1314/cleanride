import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';

export const getPlans = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
  });
  res.status(200).json({ success: true, data: { plans } });
});

export const subscribe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { planId } = req.body;
  const userId = req.user.id;

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) return next(new AppError('Plan not found', 404));

  // Basic implementation: 
  // In a real scenario, this would create a razorpay order and only activate after payment verification.
  // For simplicity, we directly activate it here.
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + plan.durationDays);

  const subscription = await prisma.userSubscription.create({
    data: {
      userId,
      planId,
      endDate,
    }
  });

  res.status(201).json({ success: true, data: { subscription } });
});

export const getMySubscription = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const subscription = await prisma.userSubscription.findFirst({
    where: { 
      userId: req.user.id,
      isActive: true,
      endDate: { gte: new Date() }
    },
    include: { plan: true },
    orderBy: { createdAt: 'desc' }
  });

  res.status(200).json({ success: true, data: { subscription } });
});
