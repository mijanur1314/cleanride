import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';
import { z } from 'zod';
import { getIO } from '../socket';
import { sendEmail } from '../utils/mailer';
import { sendPushNotification } from '../utils/push';
import { razorpay } from '../utils/razorpay';
import { emailQueue } from '../utils/queue';
import { dispatchQueue } from '../queues/dispatch.queue';

const bookingSchema = z.object({
  serviceId: z.string().uuid(),
  storeId: z.string().uuid().optional(),
  vehicleType: z.string(),
  vehicleName: z.string().optional(),
  vehicleNumber: z.string().optional(),
  vehicleImage: z.string(),
  address: z.string().optional(),
  bookingDate: z.string().datetime(),
  couponId: z.string().uuid().optional(),
  partnerId: z.string().uuid().optional(),
  addonIds: z.array(z.string().uuid()).optional(),
  redeemPoints: z.number().int().min(0).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const createBooking = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const parsed = bookingSchema.safeParse(req.body);
  if (!parsed.success) return next(new AppError('Invalid input data', 400));

  const { serviceId, storeId, vehicleType, vehicleName, vehicleNumber, vehicleImage, address, bookingDate, couponId, partnerId, addonIds, redeemPoints, latitude, longitude } = parsed.data;

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

  // Calculate Surge Pricing
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const activeBookingsCount = await prisma.booking.count({
    where: {
      status: { in: ['PENDING', 'CONFIRMED', 'PARTNER_ASSIGNED', 'EN_ROUTE', 'WASH_IN_PROGRESS'] },
      createdAt: { gt: oneHourAgo }
    }
  });

  const surgeMultiplier = activeBookingsCount >= 5 ? 1.25 : 1.0;
  finalAmount = finalAmount * surgeMultiplier;


  if (couponId) {
    const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
    if (coupon && coupon.isActive && new Date(coupon.validUntil) >= new Date()) {
      // Check if user already used this coupon
      const previousUsage = await prisma.couponRedemption.findUnique({
        where: { couponId_userId: { couponId: coupon.id, userId: req.user!.id } }
      });
      
      if (previousUsage) {
        return next(new AppError('You have already used this coupon', 400));
      }

      const discount = (service.price * coupon.discountPercentage) / 100;
      finalAmount -= coupon.maxDiscount ? Math.min(discount, coupon.maxDiscount) : discount;
    } else {
      return next(new AppError('Invalid or expired coupon', 400));
    }
  }

  // We will check and decrement loyalty points atomically in the transaction

  // VIP Subscription Check: If user has an active subscription, the base service is free
  const activeSubscription = await prisma.userSubscription.findFirst({
    where: {
      userId: req.user!.id,
      isActive: true,
      endDate: { gt: new Date() }
    }
  });

  if (activeSubscription) {
    finalAmount -= service.price;
    if (finalAmount < 0) finalAmount = 0;
  }

  const booking = await prisma.$transaction(async (tx) => {
    if (redeemPoints) {
      const user = await tx.user.findUnique({ where: { id: req.user!.id } });
      if (!user || user.loyaltyPoints < redeemPoints) {
        throw new AppError('Insufficient loyalty points', 400);
      }
      
      const discount = redeemPoints * 0.1;
      finalAmount -= discount;
      if (finalAmount < 0) finalAmount = 0;

      await tx.user.update({
        where: { id: req.user!.id },
        data: { loyaltyPoints: { decrement: redeemPoints } }
      });
    }

    finalAmount = Math.round(finalAmount);

    const bookingStart = new Date(bookingDate);
    const dischargeTimeDate = new Date(bookingStart.getTime() + service.duration * 60000);

    if (partnerId) {
      const overlapping = await tx.booking.findFirst({
        where: {
          partnerId,
          status: { notIn: ['CANCELLED', 'COMPLETED'] },
          bookingDate: { lt: dischargeTimeDate },
          dischargeTime: { gt: bookingStart }
        }
      });
      if (overlapping) {
        throw new AppError('The selected time slot is no longer available.', 400);
      }
    }

    const newBooking = await tx.booking.create({
      data: {
        userId: req.user!.id,
        serviceId,
        storeId,
        vehicleType,
        vehicleName,
        vehicleNumber,
        beforeImageUrl: vehicleImage,
        address,
        bookingDate: bookingStart,
        dischargeTime: dischargeTimeDate,
        totalAmount: finalAmount,
        surgeMultiplier,
        couponId,
        partnerId,
        latitude,
        longitude,
        status: finalAmount === 0 ? 'CONFIRMED' : 'PENDING',
        bookingAddons: {
          create: addons.map((addon: { id: string; price: number }) => ({
            addonId: addon.id,
            price: addon.price
          }))
        }
      },
      include: { user: true, service: true, bookingAddons: { include: { addon: true } } }
    });

    if (couponId) {
      await tx.couponRedemption.create({
        data: {
          couponId,
          userId: req.user!.id,
          bookingId: newBooking.id
        }
      });
    }

    return newBooking;
  });

  // Dispatch confirmation email to background worker
  emailQueue.add('bookingConfirmation', {
    to: booking.user.email,
    subject: 'Booking Confirmed - CleanRide',
    body: `<h1>Your booking is confirmed!</h1>
     <p>Hi ${booking.user.name},</p>
     <p>You have successfully booked <strong>${booking.service.name}</strong> for ${new Date(booking.bookingDate).toLocaleString()}.</p>
     <p>Total Amount: $${booking.totalAmount}</p>
     <p>We will assign a partner to you shortly.</p>`
  });

  // Trigger Smart Dispatch Engine asynchronously
  if (booking.status === 'PENDING' && !booking.partnerId) {
    dispatchQueue.add('assignPartner', { bookingId: booking.id }, { delay: 5000 });
  }

  res.status(201).json({ success: true, data: { booking } });
});

export const getSurgeStatus = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const activeBookingsCount = await prisma.booking.count({
    where: {
      status: { in: ['PENDING', 'CONFIRMED', 'PARTNER_ASSIGNED', 'EN_ROUTE', 'WASH_IN_PROGRESS'] },
      createdAt: { gt: oneHourAgo }
    }
  });

  const surgeMultiplier = activeBookingsCount >= 5 ? 1.25 : 1.0;
  const isSurgeActive = surgeMultiplier > 1.0;

  res.status(200).json({ 
    success: true, 
    data: { 
      isSurgeActive, 
      surgeMultiplier,
      activeBookingsCount
    } 
  });
});

export const getMyBookings = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const where = { userId: req.user!.id };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: { service: true, partner: true, store: true, payment: true, review: true, coupon: true, bookingAddons: { include: { addon: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.booking.count({ where })
  ]);

  res.status(200).json({ 
    success: true, 
    results: bookings.length, 
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    data: { bookings } 
  });
});

export const getPartnerBookings = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const where = { partnerId: req.user!.id };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: { service: true, user: true, store: true, bookingAddons: { include: { addon: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.booking.count({ where })
  ]);

  res.status(200).json({ 
    success: true, 
    results: bookings.length, 
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    data: { bookings } 
  });
});

export const getAllBookings = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      include: { user: true, partner: true, service: true, store: true, payment: true, bookingAddons: { include: { addon: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.booking.count()
  ]);

  res.status(200).json({ 
    success: true, 
    results: bookings.length, 
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    data: { bookings } 
  });
});

export const updateBookingStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { status } = req.body;
  if (!['PENDING', 'CONFIRMED', 'PARTNER_ASSIGNED', 'EN_ROUTE', 'WASH_IN_PROGRESS', 'REVIEW_PENDING', 'COMPLETED', 'CANCELLED'].includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id as string },
    include: { user: true, partner: true }
  });

  if (!booking) return next(new AppError('Booking not found', 404));

  if (req.user!.role === 'PARTNER' && booking.partnerId !== req.user!.id) {
    return next(new AppError('You are not authorized to update this booking', 403));
  }

  const updateData: Record<string, unknown> = { status };
  if (status === 'WASH_IN_PROGRESS') {
    updateData.arrivalTime = new Date();
  } else if (status === 'COMPLETED') {
    updateData.dischargeTime = new Date();
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: req.params.id as string },
    data: updateData,
    include: { user: true, partner: true }
  });

  if (updatedBooking.userId) {
    getIO().to(updatedBooking.userId).emit('notification', {
      title: 'Booking Updated',
      message: `Your booking status is now ${status}`,
      type: 'info'
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (updatedBooking.user && (updatedBooking.user as any).pushSubscription) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pushSubscription = (updatedBooking.user as any).pushSubscription;
      await sendPushNotification(
        pushSubscription, 
        JSON.stringify({
          title: 'Booking Status Updated',
          body: `Your booking is now ${status.replace(/_/g, ' ')}.`,
          icon: '/icon512_maskable.png',
          url: '/dashboard'
        })
      );
    }

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
      ).catch(err => console.error('Failed to send email:', err));
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
  if (!partner.isVerified) {
    return next(new AppError('Partner is not verified yet', 403));
  }

  const booking = await prisma.booking.update({
    where: { id: req.params.id as string },
    data: { partnerId, status: 'PARTNER_ASSIGNED' },
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
      ).catch(err => console.error('Failed to send email:', err));
    }
  }

  res.status(200).json({ success: true, data: { booking } });
});

export const updateImages = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { beforeImageUrl, afterImageUrl } = req.body;

  const supabaseUrl = process.env.SUPABASE_URL || '';
  if (beforeImageUrl && !beforeImageUrl.startsWith(supabaseUrl)) {
    return next(new AppError('Invalid before image URL', 400));
  }
  if (afterImageUrl && !afterImageUrl.startsWith(supabaseUrl)) {
    return next(new AppError('Invalid after image URL', 400));
  }

  const existingBooking = await prisma.booking.findUnique({
    where: { id: req.params.id as string }
  });

  if (!existingBooking) return next(new AppError('Booking not found', 404));

  if (req.user!.role === 'PARTNER' && existingBooking.partnerId !== req.user!.id) {
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

export const cancelMyBooking = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id as string },
    include: { payment: true }
  });

  if (!booking) return next(new AppError('Booking not found', 404));
  if (booking.userId !== req.user!.id) return next(new AppError('You are not authorized to cancel this booking', 403));

  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
    return next(new AppError('Booking cannot be cancelled at this stage. Please contact support.', 400));
  }

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: { status: 'CANCELLED' }
    });

    if (booking.payment && booking.payment.status === 'COMPLETED' && booking.payment.razorpayId) {
      try {
        if (!booking.payment.razorpayId.startsWith('fake_')) {
          await razorpay.payments.refund(booking.payment.razorpayId, { speed: 'normal' });
        } else {
          console.log(`Skipped Razorpay refund for fake payment ID: ${booking.payment.razorpayId}`);
        }
      } catch (err: any) {
        const errorMessage = err?.error?.description || err?.message || 'Unknown error';
        console.error("Razorpay refund error:", errorMessage, err);
        throw new AppError(`Failed to process refund: ${errorMessage}`, 500);
      }
      await tx.payment.update({
        where: { id: booking.payment.id },
        data: { status: 'REFUNDED' }
      });
    }
  });

  res.status(200).json({ success: true, message: 'Booking cancelled successfully' });
});

export const rescheduleMyBooking = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { newDate } = req.body;
  if (!newDate) return next(new AppError('Please provide a new date', 400));

  const parsedDate = new Date(newDate);
  if (isNaN(parsedDate.getTime()) || parsedDate < new Date()) {
    return next(new AppError('Please provide a valid future date', 400));
  }

  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id as string }
  });

  if (!booking) return next(new AppError('Booking not found', 404));
  if (booking.userId !== req.user!.id) return next(new AppError('You are not authorized to reschedule this booking', 403));

  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
    return next(new AppError('Booking cannot be rescheduled at this stage.', 400));
  }

  const updatedBooking = await prisma.booking.update({
    where: { id: booking.id },
    data: { bookingDate: parsedDate }
  });

  res.status(200).json({ success: true, data: { booking: updatedBooking } });
});

export const adminCancelBooking = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id as string },
    include: { payment: true }
  });

  if (!booking) return next(new AppError('Booking not found', 404));

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: { status: 'CANCELLED' }
    });

    if (booking.payment && booking.payment.status === 'COMPLETED' && booking.payment.razorpayId) {
      try {
        if (!booking.payment.razorpayId.startsWith('fake_')) {
          await razorpay.payments.refund(booking.payment.razorpayId, { speed: 'normal' });
        } else {
          console.log(`Skipped Razorpay refund for fake payment ID: ${booking.payment.razorpayId}`);
        }
      } catch (err: any) {
        const errorMessage = err?.error?.description || err?.message || 'Unknown error';
        console.error("Razorpay refund error:", errorMessage, err);
        throw new AppError(`Failed to process refund: ${errorMessage}`, 500);
      }
      await tx.payment.update({
        where: { id: booking.payment.id },
        data: { status: 'REFUNDED' }
      });
    }
  });

  res.status(200).json({ success: true, message: 'Booking cancelled by admin successfully' });
});
