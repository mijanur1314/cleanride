import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';
import { z } from 'zod';

const bookingSchema = z.object({
  serviceId: z.string().uuid(),
  storeId: z.string().uuid().optional(),
  vehicleType: z.string(),
  vehicleNumber: z.string().optional(),
  address: z.string().optional(),
  bookingDate: z.string().datetime(),
  couponId: z.string().uuid().optional(),
});

export const createBooking = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const parsed = bookingSchema.safeParse(req.body);
  if (!parsed.success) return next(new AppError('Invalid input data', 400));

  const { serviceId, storeId, vehicleType, vehicleNumber, address, bookingDate, couponId } = parsed.data;

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) return next(new AppError('Service not found', 404));

  let finalAmount = service.price;
  if (couponId) {
    const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
    if (coupon && coupon.isActive && new Date(coupon.validUntil) >= new Date()) {
      const discount = (service.price * coupon.discountPercentage) / 100;
      finalAmount -= coupon.maxDiscount ? Math.min(discount, coupon.maxDiscount) : discount;
    }
  }

  const booking = await prisma.booking.create({
    data: {
      userId: req.user.id,
      serviceId,
      storeId,
      vehicleType,
      vehicleNumber,
      address,
      bookingDate: new Date(bookingDate),
      totalAmount: finalAmount,
      couponId,
    },
  });

  res.status(201).json({ success: true, data: { booking } });
});

export const getMyBookings = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const bookings = await prisma.booking.findMany({
    where: { userId: req.user.id },
    include: { service: true, partner: true, store: true, payment: true, review: true, coupon: true },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({ success: true, results: bookings.length, data: { bookings } });
});

export const getPartnerBookings = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const bookings = await prisma.booking.findMany({
    where: { partnerId: req.user.id },
    include: { service: true, user: true, store: true },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({ success: true, results: bookings.length, data: { bookings } });
});

export const getAllBookings = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const bookings = await prisma.booking.findMany({
    include: { user: true, partner: true, service: true, store: true, payment: true },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({ success: true, results: bookings.length, data: { bookings } });
});

export const updateBookingStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { status } = req.body;
  if (!['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  const booking = await prisma.booking.update({
    where: { id: req.params.id as string },
    data: { status },
  });

  res.status(200).json({ success: true, data: { booking } });
});

export const assignPartner = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { partnerId } = req.body;

  const partner = await prisma.user.findUnique({ where: { id: partnerId } });
  if (!partner || partner.role !== 'PARTNER') {
    return next(new AppError('Invalid partner ID', 400));
  }

  const booking = await prisma.booking.update({
    where: { id: req.params.id as string },
    data: { partnerId, status: 'CONFIRMED' },
  });

  res.status(200).json({ success: true, data: { booking } });
});

export const updateImages = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { beforeImageUrl, afterImageUrl } = req.body;
  const booking = await prisma.booking.update({
    where: { id: req.params.id as string },
    data: {
      ...(beforeImageUrl && { beforeImageUrl }),
      ...(afterImageUrl && { afterImageUrl })
    }
  });
  res.status(200).json({ success: true, data: { booking } });
});
