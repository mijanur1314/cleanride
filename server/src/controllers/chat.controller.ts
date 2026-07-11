import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';

export const getBookingMessages = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { bookingId } = req.params;

  const messages = await prisma.message.findMany({
    where: { bookingId: bookingId as string },
    include: { sender: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: 'asc' }
  });

  res.status(200).json({ success: true, results: messages.length, data: { messages } });
});
