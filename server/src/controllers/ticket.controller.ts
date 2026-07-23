import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';

export const createTicket = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { subject, message } = req.body;
  if (!subject || !message) {
    return next(new AppError('Please provide a subject and a message.', 400));
  }

  const ticket = await prisma.ticket.create({
    data: {
      userId: req.user!.id,
      subject,
      messages: {
        create: {
          senderId: req.user!.id,
          content: message,
        }
      }
    },
    include: {
      messages: true
    }
  });

  res.status(201).json({
    success: true,
    data: { ticket }
  });
});

export const getMyTickets = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const tickets = await prisma.ticket.findMany({
    where: { userId: req.user!.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { messages: true } }
    }
  });

  res.status(200).json({
    success: true,
    results: tickets.length,
    data: { tickets }
  });
});

export const getAllTickets = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
  const tickets = await prisma.ticket.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      user: { select: { name: true, email: true, role: true } },
      _count: { select: { messages: true } }
    }
  });

  res.status(200).json({
    success: true,
    results: tickets.length,
    data: { tickets }
  });
});

export const getTicketDetails = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: req.params.id as string },
    include: {
      user: { select: { name: true, email: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: {
          sender: { select: { name: true, role: true } }
        }
      }
    }
  });

  if (!ticket) {
    return next(new AppError('Ticket not found', 404));
  }

  if (ticket.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
    return next(new AppError('You do not have permission to view this ticket', 403));
  }

  res.status(200).json({
    success: true,
    data: { ticket }
  });
});

export const replyToTicket = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { content } = req.body;
  if (!content) {
    return next(new AppError('Message content is required', 400));
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id as string } });
  if (!ticket) {
    return next(new AppError('Ticket not found', 404));
  }

  if (ticket.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
    return next(new AppError('You do not have permission to reply to this ticket', 403));
  }

  if (ticket.status === 'CLOSED') {
    return next(new AppError('Cannot reply to a closed ticket', 400));
  }

  const message = await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      senderId: req.user!.id,
      content
    },
    include: {
      sender: { select: { name: true, role: true } }
    }
  });

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status: req.user!.role === 'ADMIN' ? 'RESOLVED' : 'IN_PROGRESS',
      updatedAt: new Date()
    }
  });

  res.status(201).json({
    success: true,
    data: { message }
  });
});

export const updateTicketStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { status } = req.body;
  if (!['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  const ticket = await prisma.ticket.update({
    where: { id: req.params.id as string },
    data: { status }
  });

  res.status(200).json({
    success: true,
    data: { ticket }
  });
});
