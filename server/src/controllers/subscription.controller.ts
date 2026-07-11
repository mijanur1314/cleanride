import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

export const getPlans = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' }
  });
  res.status(200).json({ success: true, data: { plans } });
});

export const createSubscriptionOrder = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { planId } = req.body;
  const userId = req.user.id;

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) return next(new AppError('Plan not found', 404));

  const amountInPaise = Math.round(plan.price * 100);

  const options = {
    amount: amountInPaise,
    currency: 'INR',
    receipt: `sub_${userId.substring(0, 8)}_${Date.now()}`,
  };

  const order = await razorpay.orders.create(options);

  res.status(200).json({
    success: true,
    data: { order, plan }
  });
});

export const verifySubscription = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;
  const userId = req.user.id;

  const secret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generatedSignature !== razorpay_signature) {
    return next(new AppError('Payment verification failed', 400));
  }

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) return next(new AppError('Plan not found', 404));

  // Deactivate existing active subscriptions for this user
  await prisma.userSubscription.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false }
  });

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + plan.durationDays);

  const subscription = await prisma.userSubscription.create({
    data: {
      userId,
      planId,
      endDate,
      isActive: true
    }
  });

  res.status(200).json({
    success: true,
    message: 'Subscription verified and activated successfully',
    data: { subscription }
  });
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
