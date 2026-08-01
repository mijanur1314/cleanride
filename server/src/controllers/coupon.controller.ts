import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';

export const validateCoupon = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { code } = req.body;

  if (!code) return next(new AppError('Please provide a coupon code', 400));

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() }
  });

  if (!coupon) return next(new AppError('Invalid coupon code', 404));
  if (!coupon.isActive) return next(new AppError('This coupon is no longer active', 400));
  if (new Date(coupon.validUntil) < new Date()) return next(new AppError('This coupon has expired', 400));

  // Check if user has already used this coupon
  const userId = req.user?.id;
  if (userId) {
    const existingRedemption = await prisma.couponRedemption.findUnique({
      where: { couponId_userId: { couponId: coupon.id, userId } }
    });
    if (existingRedemption) {
      return next(new AppError('You have already used this coupon', 400));
    }
  }

  res.status(200).json({ success: true, data: { coupon } });
});

export const getActiveCoupons = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const coupons = await prisma.coupon.findMany({
    where: { 
      isActive: true,
      validUntil: { gte: new Date() }
    }
  });

  res.status(200).json({ success: true, results: coupons.length, data: { coupons } });
});

export const getAllCoupons = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' }
  });
  res.status(200).json({ success: true, results: coupons.length, data: { coupons } });
});

export const createCoupon = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { code, discountPercentage, maxDiscount, validUntil } = req.body;
  if (!code || !discountPercentage || !validUntil) {
    return next(new AppError('Please provide code, discount percentage, and expiry date', 400));
  }

  const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (existing) return next(new AppError('Coupon code already exists', 400));

  const coupon = await prisma.coupon.create({
    data: {
      code: code.toUpperCase(),
      discountPercentage: parseInt(discountPercentage, 10),
      maxDiscount: maxDiscount ? parseInt(maxDiscount, 10) : null,
      validUntil: new Date(validUntil)
    }
  });

  res.status(201).json({ success: true, data: { coupon } });
});

export const updateCoupon = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const { isActive, validUntil } = req.body;
  
  const data: Record<string, unknown> = {};
  if (isActive !== undefined) data.isActive = isActive;
  if (validUntil) data.validUntil = new Date(validUntil);

  const coupon = await prisma.coupon.update({
    where: { id: req.params.id as string },
    data
  });

  res.status(200).json({ success: true, data: { coupon } });
});

export const deleteCoupon = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  await prisma.coupon.delete({
    where: { id: req.params.id as string }
  });

  res.status(204).json({ success: true, data: null });
});
