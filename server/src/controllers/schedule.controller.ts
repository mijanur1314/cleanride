import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';

export const getAvailableSlots = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { date, serviceId, partnerId } = req.query;

  if (!date || !serviceId) {
    return next(new AppError('Please provide date and serviceId', 400));
  }

  const queryDate = new Date(date as string);
  if (isNaN(queryDate.getTime())) {
    return next(new AppError('Invalid date format', 400));
  }

  const service = await prisma.service.findUnique({ where: { id: serviceId as string } });
  if (!service) {
    return next(new AppError('Service not found', 404));
  }

  const dayOfWeek = queryDate.getDay();

  // Find schedules for that day
  const schedules = await prisma.partnerSchedule.findMany({
    where: {
      dayOfWeek,
      isActive: true,
      ...(partnerId ? { partnerId: partnerId as string } : {})
    },
    include: { partner: true }
  });

  if (schedules.length === 0) {
    return res.status(200).json({ success: true, data: [] });
  }

  // Get all active bookings for these partners on this date
  const startOfDay = new Date(queryDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(queryDate);
  endOfDay.setHours(23, 59, 59, 999);

  const bookings = await prisma.booking.findMany({
    where: {
      partnerId: { in: schedules.map((s: any) => s.partnerId) },
      status: { notIn: ['CANCELLED', 'COMPLETED'] }, 
      bookingDate: { gte: startOfDay, lte: endOfDay }
    }
  });

  const availableSlots: any[] = [];
  
  for (const schedule of schedules) {
    const [startHour, startMin] = schedule.startTime.split(':').map(Number);
    const [endHour, endMin] = schedule.endTime.split(':').map(Number);

    let currentSlot = new Date(queryDate);
    currentSlot.setHours(startHour, startMin, 0, 0);

    const scheduleEnd = new Date(queryDate);
    scheduleEnd.setHours(endHour, endMin, 0, 0);

    const partnerBookings = bookings.filter(b => b.partnerId === schedule.partnerId);

    while (currentSlot < scheduleEnd) {
      const slotEnd = new Date(currentSlot.getTime() + service.duration * 60000);
      
      if (slotEnd > scheduleEnd) break;

      const hasOverlap = partnerBookings.some(booking => {
        const bookingStart = new Date(booking.bookingDate);
        const bookingEnd = booking.dischargeTime ? new Date(booking.dischargeTime) : new Date(bookingStart.getTime() + 60 * 60000);
        
        return currentSlot < bookingEnd && slotEnd > bookingStart;
      });

      // Also ensure slot is in the future if checking today
      if (!hasOverlap && currentSlot > new Date()) {
        availableSlots.push({
          startTime: new Date(currentSlot),
          endTime: new Date(slotEnd),
          partnerId: schedule.partnerId,
          partnerName: schedule.partner.name
        });
      }

      // Increment by 30 mins
      currentSlot = new Date(currentSlot.getTime() + 30 * 60000);
    }
  }

  res.status(200).json({ success: true, data: availableSlots });
});

export const getMySchedule = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const partnerId = req.user?.id;
  if (!partnerId) {
    return next(new AppError('Not authorized', 401));
  }

  const schedules = await prisma.partnerSchedule.findMany({
    where: { partnerId },
    orderBy: { dayOfWeek: 'asc' }
  });

  res.status(200).json({ success: true, data: schedules });
});

export const updateMySchedule = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const partnerId = req.user?.id;
  if (!partnerId) {
    return next(new AppError('Not authorized', 401));
  }

  const { schedules } = req.body; // Expecting array of { dayOfWeek, startTime, endTime, isActive }

  if (!Array.isArray(schedules)) {
    return next(new AppError('Schedules must be an array', 400));
  }

  // Use a transaction to update the schedule
  await prisma.$transaction(async (tx) => {
    for (const schedule of schedules) {
      const { dayOfWeek, startTime, endTime, isActive } = schedule;
      
      // Upsert each day schedule
      await tx.partnerSchedule.upsert({
        where: {
          partnerId_dayOfWeek: {
            partnerId,
            dayOfWeek
          }
        },
        update: {
          startTime,
          endTime,
          isActive
        },
        create: {
          partnerId,
          dayOfWeek,
          startTime,
          endTime,
          isActive
        }
      });
    }
  });

  res.status(200).json({ success: true, message: 'Schedule updated successfully' });
});
