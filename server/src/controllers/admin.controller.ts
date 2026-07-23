import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';
import { sendEmail } from '../utils/email';
import { getIO } from '../socket';

export const getDashboardStats = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  // Aggregate stats
  const totalUsers = await prisma.user.count({ where: { role: 'USER' } });
  const totalPartners = await prisma.user.count({ where: { role: 'PARTNER' } });
  const totalBookings = await prisma.booking.count();
  
  // Calculate total revenue (assuming payments are successful)
  const bookings = await prisma.booking.findMany({
    select: { totalAmount: true }
  });
  const totalRevenue = bookings.reduce((sum: number, booking: { totalAmount: number }) => sum + booking.totalAmount, 0);

  // 7-day revenue trend
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentPaidBookings = await prisma.booking.findMany({
    where: { 
      createdAt: { gte: sevenDaysAgo },
      status: { notIn: ['CANCELLED'] }
    },
    select: { createdAt: true, totalAmount: true }
  });

  const revenueByDayMap = new Map();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    revenueByDayMap.set(dateStr, { date: dateStr, revenue: 0, bookings: 0 });
  }

  for (const b of recentPaidBookings) {
    const dateStr = new Date(b.createdAt).toISOString().split('T')[0];
    if (revenueByDayMap.has(dateStr)) {
      const entry = revenueByDayMap.get(dateStr);
      entry.revenue += b.totalAmount;
      entry.bookings += 1;
    }
  }
  const revenueByDay = Array.from(revenueByDayMap.values());

  // Top Partners
  const allPartners = await prisma.user.findMany({
    where: { role: 'PARTNER' },
    select: { id: true, name: true, email: true, isVerified: true }
  });
  
  const completedJobsCount = await prisma.booking.groupBy({
    by: ['partnerId'],
    where: { status: 'COMPLETED', partnerId: { not: null } },
    _count: { id: true }
  });

  const partnerMap = new Map(allPartners.map(p => [p.id, p]));
  const topPartners = completedJobsCount
    .map(stat => ({
      ...partnerMap.get(stat.partnerId as string),
      completedJobs: stat._count.id
    }))
    .filter(p => p.id)
    .sort((a, b) => b.completedJobs - a.completedJobs)
    .slice(0, 5);

  // Assignment Queue
  const assignmentQueue = await prisma.booking.findMany({
    where: { status: 'PENDING' },
    orderBy: { bookingDate: 'asc' },
    include: {
      user: { select: { name: true, email: true } },
      service: { select: { name: true } }
    }
  });

  // Get recent bookings
  const recentBookings = await prisma.booking.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } },
      partner: { select: { name: true } },
      service: { select: { name: true } }
    }
  });

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalUsers,
        totalPartners,
        totalBookings,
        totalRevenue
      },
      recentBookings,
      revenueByDay,
      topPartners,
      assignmentQueue,
      availablePartners: allPartners
    }
  });
});

export const getAllUsers = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      loyaltyPoints: true,
      isVerified: true,
      kycDocumentUrl: true,
      kycSelfieUrl: true,
      isBanned: true
    },
    orderBy: { createdAt: 'desc' }
  });

  res.status(200).json({
    success: true,
    results: users.length,
    data: { users }
  });
});

export const getAllBookings = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const bookings = await prisma.booking.findMany({
    include: {
      user: { select: { name: true, email: true } },
      partner: { select: { name: true, email: true } },
      service: { select: { name: true, price: true } },
      bookingAddons: { select: { addon: { select: { name: true, price: true } } } }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.status(200).json({
    success: true,
    results: bookings.length,
    data: { bookings }
  });
});

export const assignPartnerToBooking = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const bookingId = req.params.bookingId as string;
  const partnerId = req.body.partnerId as string;

  if (!partnerId) return next(new AppError('Partner ID is required', 400));

  const partner = await prisma.user.findUnique({ where: { id: partnerId } });
  if (!partner || partner.role !== 'PARTNER') {
    return next(new AppError('Invalid partner ID', 400));
  }
  if (!partner.isVerified) {
    return next(new AppError('Partner is not verified yet', 403));
  }

  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: { 
      partnerId,
      status: 'CONFIRMED' // Update status once assigned
    },
    include: {
      user: { select: { name: true, email: true } },
      partner: { select: { name: true, email: true } },
      service: { select: { name: true } }
    }
  });

  // Notify User
  if (booking.user) {
    await sendEmail({
      to: booking.user.email,
      subject: 'CleanRide - Partner Assigned to Your Booking',
      html: `
        <h2>Great News!</h2>
        <p>Hi ${booking.user.name},</p>
        <p>A service partner (<strong>${booking.partner?.name}</strong>) has been assigned to your ${booking.service.name} booking.</p>
        <p>They will arrive at the scheduled time.</p>
        <br/>
        <p>Thank you for choosing CleanRide!</p>
      `
    });
  }

  // Notify Partner
  if (booking.partner) {
    await sendEmail({
      to: booking.partner.email,
      subject: 'CleanRide - New Booking Assigned to You',
      html: `
        <h2>New Job Assigned</h2>
        <p>Hi ${booking.partner.name},</p>
        <p>You have been assigned a new <strong>${booking.service.name}</strong> job.</p>
        <p>Please check your partner dashboard for location and timing details.</p>
        <br/>
        <p>Best,<br/>CleanRide Admin</p>
      `
    });
  }

  // Emit WebSocket Event to the User's personal room to trigger UI update
  getIO().to(booking.userId).emit('booking-updated', {
    bookingId: booking.id,
    status: booking.status,
    partnerName: booking.partner?.name,
    message: 'A partner has been assigned to your booking!'
  });

  res.status(200).json({
    success: true,
    data: { booking }
  });
});

export const verifyPartner = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.params.userId as string;
  const { isVerified } = req.body;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== 'PARTNER') {
    return next(new AppError('Invalid partner ID', 400));
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { isVerified },
    select: { id: true, name: true, isVerified: true }
  });

  res.status(200).json({ success: true, data: { user: updatedUser } });
});
