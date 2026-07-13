import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { getIO } from '../socket';
import { sendEmail } from '../utils/mailer';

const bookingSchema = z.object({
  serviceId: z.string().uuid(),
  storeId: z.string().uuid().optional(),
  vehicleType: z.string(),
  vehicleNumber: z.string().optional(),
  address: z.string().optional(),
  bookingDate: z.string().datetime(),
  couponId: z.string().uuid().optional(),
  addonIds: z.array(z.string().uuid()).optional(),
  redeemPoints: z.number().int().min(0).optional(),
});

export const createBooking = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const parsed = bookingSchema.safeParse(req.body);
  if (!parsed.success) return next(new AppError('Invalid input data', 400));

  const { serviceId, storeId, vehicleType, vehicleNumber, address, bookingDate, couponId, addonIds, redeemPoints } = parsed.data;

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) return next(new AppError('Service not found', 404));

  let finalAmount = service.price;
  
  // Calculate Add-ons
  const addons = addonIds?.length ? await prisma.addon.findMany({
    where: { id: { in: addonIds } }
  }) : [];
  
  for (const addon of addons) {
    finalAmount += addon.price;
  }

  if (couponId) {
    const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
    if (coupon && coupon.isActive && new Date(coupon.validUntil) >= new Date()) {
      const discount = (service.price * coupon.discountPercentage) / 100;
      finalAmount -= coupon.maxDiscount ? Math.min(discount, coupon.maxDiscount) : discount;
    }
  }

  if (redeemPoints) {
    // Validate user has enough points
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || user.loyaltyPoints < redeemPoints) {
      return next(new AppError('Insufficient loyalty points', 400));
    }
    // 10 points = $1 discount
    const pointsDiscount = redeemPoints * 0.1;
    finalAmount -= pointsDiscount;
    if (finalAmount < 0) finalAmount = 0;

    // Deduct points
    await prisma.user.update({
      where: { id: req.user.id },
      data: { loyaltyPoints: { decrement: redeemPoints } }
    });
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
      bookingAddons: {
        create: addons.map((addon: string) => ({
          addonId: addon.id,
          price: addon.price
        }))
      }
    },
    include: { user: true, service: true, bookingAddons: { include: { addon: true } } }
  });

  // Send confirmation email
  sendEmail(
    booking.user.email,
    'Booking Confirmed - CleanRide',
    `<h1>Your booking is confirmed!</h1>
     <p>Hi ${booking.user.name},</p>
     <p>You have successfully booked <strong>${booking.service.name}</strong> for ${new Date(booking.bookingDate).toLocaleString()}.</p>
     <p>Total Amount: $${booking.totalAmount}</p>
     <p>We will assign a partner to you shortly.</p>`
  );

  res.status(201).json({ success: true, data: { booking } });
});

export const getMyBookings = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const bookings = await prisma.booking.findMany({
    where: { userId: req.user.id },
    include: { service: true, partner: true, store: true, payment: true, review: true, coupon: true, bookingAddons: { include: { addon: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({ success: true, results: bookings.length, data: { bookings } });
});

export const getPartnerBookings = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const bookings = await prisma.booking.findMany({
    where: { partnerId: req.user.id },
    include: { service: true, user: true, store: true, bookingAddons: { include: { addon: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({ success: true, results: bookings.length, data: { bookings } });
});

export const getAllBookings = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const bookings = await prisma.booking.findMany({
    include: { user: true, partner: true, service: true, store: true, payment: true, bookingAddons: { include: { addon: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.status(200).json({ success: true, results: bookings.length, data: { bookings } });
});

export const updateBookingStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { status } = req.body;
  if (!['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id as string },
    include: { user: true, partner: true }
  });

  if (!booking) return next(new AppError('Booking not found', 404));

  if (req.user.role === 'PARTNER' && booking.partnerId !== req.user.id) {
    return next(new AppError('You are not authorized to update this booking', 403));
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: req.params.id as string },
    data: { status },
    include: { user: true, partner: true }
  });

  if (updatedBooking.userId) {
    getIO().to(updatedBooking.userId).emit('notification', {
      title: 'Booking Updated',
      message: `Your booking status is now ${status}`,
      type: 'info'
    });

    if (status === 'COMPLETED' && updatedBooking.user) {
      // Award loyalty points (1 point per $1 spent)
      const pointsEarned = Math.floor(updatedBooking.totalAmount);
      await prisma.user.update({
        where: { id: updatedBooking.userId },
        data: { loyaltyPoints: { increment: pointsEarned } }
      });

      sendEmail(
        updatedBooking.user.email,
        'Wash Completed! - CleanRide',
        `<h1>Your service is complete!</h1>
         <p>Hi ${booking.user.name},</p>
         <p>Your vehicle wash service has been marked as <strong>COMPLETED</strong>.</p>
         <p>We hope you enjoy your clean ride. Please log in to your dashboard to leave a review!</p>
         <p>Thanks for choosing CleanRide.</p>`
      );
    }
  }

  res.status(200).json({ success: true, data: { booking: updatedBooking } });
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
    include: { user: true, partner: true }
  });

  // Notify the assigned partner
  if (booking.partnerId) {
    getIO().to(booking.partnerId).emit('notification', {
      title: 'New Job Assigned',
      message: 'You have been assigned to a new wash job.',
      type: 'success'
    });
  }

  // Notify the user
  if (booking.userId) {
    getIO().to(booking.userId).emit('notification', {
      title: 'Partner Assigned',
      message: `${booking.partner?.name || 'A partner'} has been assigned to your booking.`,
      type: 'success'
    });

    if (booking.user) {
      sendEmail(
        booking.user.email,
        'Partner Assigned - CleanRide',
        `<h1>Your Wash Partner is on the way!</h1>
         <p>Hi ${booking.user.name},</p>
         <p><strong>${booking.partner?.name || 'A partner'}</strong> has been assigned to your booking and will be arriving at your location.</p>
         <p>If you need to contact them, please reach out via the platform.</p>`
      );
    }
  }

  res.status(200).json({ success: true, data: { booking } });
});

export const updateImages = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  
  let beforeImageUrl;
  let afterImageUrl;

  if (files?.beforeImage) {
    beforeImageUrl = `/uploads/${files.beforeImage[0].filename}`;
  }
  if (files?.afterImage) {
    afterImageUrl = `/uploads/${files.afterImage[0].filename}`;
  }

  const existingBooking = await prisma.booking.findUnique({
    where: { id: req.params.id as string }
  });

  if (!existingBooking) return next(new AppError('Booking not found', 404));

  if (req.user.role === 'PARTNER' && existingBooking.partnerId !== req.user.id) {
    return next(new AppError('You are not authorized to update this booking', 403));
  }

  const booking = await prisma.booking.update({
    where: { id: req.params.id as string },
    data: {
      ...(beforeImageUrl && { beforeImageUrl }),
      ...(afterImageUrl && { afterImageUrl })
    }
  });
  res.status(200).json({ success: true, data: { booking } });
});
