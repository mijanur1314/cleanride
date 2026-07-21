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
