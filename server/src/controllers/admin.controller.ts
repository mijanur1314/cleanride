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
  
  // Calculate total revenue from completed payments only
  const completedPayments = await prisma.payment.findMany({
    where: { status: 'COMPLETED' },
    select: { amount: true }
  });
  const totalRevenue = completedPayments.reduce((sum: number, payment: { amount: number }) => sum + payment.amount, 0);

  const period = (req.query.period as string) || '7d';
  const startDate = new Date();
  let daysToFetch = 7;
  let groupByMonth = false;
  let fetchAll = false;

  if (period === '30d') {
    daysToFetch = 30;
    startDate.setDate(startDate.getDate() - 30);
  } else if (period === '1y') {
    daysToFetch = 365;
    startDate.setFullYear(startDate.getFullYear() - 1);
    groupByMonth = true;
  } else if (period === 'all') {
    fetchAll = true;
    groupByMonth = true;
  } else {
    startDate.setDate(startDate.getDate() - 7);
  }
  startDate.setHours(0, 0, 0, 0);

  const recentCompletedPayments = await prisma.payment.findMany({
    where: { 
      ...(fetchAll ? {} : { createdAt: { gte: startDate } }),
      status: 'COMPLETED'
    },
    select: { createdAt: true, amount: true },
    orderBy: { createdAt: 'asc' }
  });

  const revenueByDayMap = new Map();
  
  if (groupByMonth) {
    let startMonth = new Date();
    startMonth.setMonth(startMonth.getMonth() - 11); // Default to 12 months for 1y
    
    if (fetchAll && recentCompletedPayments.length > 0) {
      startMonth = new Date(recentCompletedPayments[0].createdAt);
    }
    
    // Initialize months from startMonth to now
    const now = new Date();
    const tempDate = new Date(startMonth);
    tempDate.setDate(1); // Set to first of month
    
    while (tempDate <= now || (tempDate.getMonth() === now.getMonth() && tempDate.getFullYear() === now.getFullYear())) {
      const monthStr = tempDate.toISOString().slice(0, 7); // YYYY-MM
      revenueByDayMap.set(monthStr, { date: monthStr + '-01', revenue: 0, bookings: 0 }); // Append -01 for easy parsing
      tempDate.setMonth(tempDate.getMonth() + 1);
    }
    
    for (const p of recentCompletedPayments) {
      const monthStr = new Date(p.createdAt).toISOString().slice(0, 7);
      if (revenueByDayMap.has(monthStr)) {
        const entry = revenueByDayMap.get(monthStr);
        entry.revenue += p.amount;
        entry.bookings += 1;
      }
    }
  } else {
    // Initialize days
    for (let i = daysToFetch - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      revenueByDayMap.set(dateStr, { date: dateStr, revenue: 0, bookings: 0 });
    }

    for (const p of recentCompletedPayments) {
      const dateStr = new Date(p.createdAt).toISOString().split('T')[0];
      if (revenueByDayMap.has(dateStr)) {
        const entry = revenueByDayMap.get(dateStr);
        entry.revenue += p.amount;
        entry.bookings += 1;
      }
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

  // Vehicle Distribution
  const vehicleGroups = await prisma.booking.groupBy({
    by: ['vehicleType'],
    _count: { id: true }
  });
  const vehicleDistribution = vehicleGroups.map(v => ({
    name: v.vehicleType,
    value: v._count.id
  }));

  // Service Distribution
  const serviceGroups = await prisma.booking.groupBy({
    by: ['serviceId'],
    _count: { id: true }
  });
  
  // Need to get service names
  const allServices = await prisma.service.findMany({ select: { id: true, name: true } });
  const serviceMap = new Map(allServices.map(s => [s.id, s.name]));
  const serviceDistribution = serviceGroups.map(s => ({
    name: serviceMap.get(s.serviceId) || 'Unknown',
    value: s._count.id
  }));

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
      availablePartners: allPartners,
      vehicleDistribution,
      serviceDistribution
    }
  });
});

export const getAllUsers = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
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
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count()
  ]);

  res.status(200).json({
    success: true,
    results: users.length,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    data: { users }
  });
});

export const getAllBookings = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      include: {
        user: { select: { name: true, email: true } },
        partner: { select: { name: true, email: true } },
        service: { select: { name: true, price: true } },
        bookingAddons: { select: { addon: { select: { name: true, price: true } } } }
      },
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
    sendEmail({
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
    }).catch(err => console.error('Failed to send email:', err));
  }

  // Notify Partner
  if (booking.partner) {
    sendEmail({
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
    }).catch(err => console.error('Failed to send email:', err));
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
