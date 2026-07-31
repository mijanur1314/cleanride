import { env } from '../utils/env';
import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export const getPlans = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' }
  });
  res.status(200).json({ success: true, data: { plans } });
});

export const createSubscription = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { planId } = req.body;
  const userId = req.user!.id;

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) return next(new AppError('Plan not found', 404));

  if (!plan.razorpayPlanId) {
    return next(new AppError('Razorpay plan ID is not configured for this plan', 400));
  }

  // Check if user already has an active subscription for this plan
  const existingSubscription = await prisma.userSubscription.findFirst({
    where: {
      userId,
      planId: plan.id,
      isActive: true,
      endDate: { gt: new Date() },
    },
  });

  if (existingSubscription) {
    return next(new AppError('You already have an active subscription for this plan', 400));
  }

  const options = {
    plan_id: plan.razorpayPlanId,
    customer_notify: 1 as 1,
    total_count: 120, // 10 years of monthly billing, can be cancelled anytime
  };

  const subscription = await razorpay.subscriptions.create(options);

  res.status(200).json({
    success: true,
    data: { subscription, plan }
  });
});

export const verifySubscription = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { razorpay_subscription_id, razorpay_payment_id, razorpay_signature, planId } = req.body;
  const userId = req.user!.id;

  if (!env.RAZORPAY_KEY_SECRET) {
    return next(new AppError('Payment gateway is not configured securely', 500));
  }

  const body = razorpay_payment_id + '|' + razorpay_subscription_id;

  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
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
      isActive: true,
      razorpaySubscriptionId: razorpay_subscription_id,
    }
  });

  res.status(200).json({
    success: true,
    message: 'Subscription verified and activated successfully',
    data: { subscription }
  });
});

export const getMySubscription = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const subscription = await prisma.userSubscription.findFirst({
    where: { 
      userId: req.user!.id,
      isActive: true,
      endDate: { gte: new Date() }
    },
    include: { plan: true },
    orderBy: { createdAt: 'desc' }
  });

  res.status(200).json({ success: true, data: { subscription } });
});

// --- ADMIN ROUTES ---

export const getAllPlans = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: { createdAt: 'desc' }
  });
  res.status(200).json({ success: true, data: { plans } });
});

export const createPlan = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { name, price, durationDays, benefits } = req.body;

  if (!name || !price || !durationDays) {
    return next(new AppError('Please provide name, price, and durationDays', 400));
  }

  // Create plan on Razorpay
  let period: "daily" | "weekly" | "monthly" | "yearly" = 'daily';
  let interval = parseInt(durationDays);

  if (interval === 30) {
    period = 'monthly';
    interval = 1;
  } else if (interval === 365) {
    period = 'yearly';
    interval = 1;
  } else if (interval === 7) {
    period = 'weekly';
    interval = 1;
  }

  const rzpyPlan = await razorpay.plans.create({
    period: period,
    interval: interval,
    item: {
      name: name,
      amount: parseInt(price) * 100, // Convert to paise
      currency: "INR",
      description: `CleanRide Subscription: ${name}`
    }
  }) as any;

  if (!rzpyPlan || !rzpyPlan.id) {
    return next(new AppError('Failed to generate plan in payment gateway', 500));
  }

  // Save to DB
  const plan = await prisma.subscriptionPlan.create({
    data: {
      name,
      price: parseFloat(price),
      durationDays: parseInt(durationDays),
      benefits: benefits || [],
      razorpayPlanId: rzpyPlan.id
    }
  });

  res.status(201).json({ success: true, data: { plan } });
});

export const updatePlan = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const { isActive, benefits, name } = req.body;
  
  const data: any = {};
  if (isActive !== undefined) data.isActive = isActive;
  if (benefits) data.benefits = benefits;
  if (name) data.name = name;

  const plan = await prisma.subscriptionPlan.update({
    where: { id: req.params.id as string },
    data
  });

  res.status(200).json({ success: true, data: { plan } });
});

export const deletePlan = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  await prisma.subscriptionPlan.delete({
    where: { id: req.params.id as string }
  });
  res.status(204).json({ success: true, data: null });
});
