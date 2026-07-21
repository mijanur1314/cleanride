import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';

export const createReview = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { bookingId, rating, comment } = req.body;
  const userId = req.user!.id;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return next(new AppError('Booking not found', 404));
  if (booking.userId !== userId) return next(new AppError('Unauthorized', 403));
  if (booking.status !== 'COMPLETED') return next(new AppError('Can only review completed bookings', 400));

  const existingReview = await prisma.review.findUnique({ where: { bookingId } });
  if (existingReview) return next(new AppError('Review already exists for this booking', 400));

  const review = await prisma.review.create({
    data: {
      userId,
      bookingId,
      rating: Number(rating),
      comment
    }
  });

  res.status(201).json({ success: true, data: { review } });
});

export const getReviews = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const reviews = await prisma.review.findMany({
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.status(200).json({ success: true, results: reviews.length, data: { reviews } });
});
