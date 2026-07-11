import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
});

export const createOrder = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { bookingId } = req.body;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });

  if (!booking) return next(new AppError('Booking not found', 404));
  if (booking.userId !== req.user.id) return next(new AppError('Unauthorized access to booking', 403));
  if (booking.payment?.status === 'COMPLETED') return next(new AppError('Payment already completed', 400));

  const amountInPaise = Math.round(booking.totalAmount * 100);

  const options = {
    amount: amountInPaise,
    currency: 'INR',
    receipt: `receipt_${bookingId.substring(0, 8)}`,
  };

  const order = await razorpay.orders.create(options);

  // Create or update payment record
  if (booking.payment) {
    await prisma.payment.update({
      where: { id: booking.payment.id },
      data: { razorpayId: order.id, status: 'PENDING' },
    });
  } else {
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.totalAmount,
        razorpayId: order.id,
        status: 'PENDING',
      },
    });
  }

  res.status(200).json({
    success: true,
    data: { order },
  });
});

export const verifyPayment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = req.body;

  const secret = process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder';
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generatedSignature !== razorpay_signature) {
    return next(new AppError('Payment verification failed', 400));
  }

  // Update payment status
  const payment = await prisma.payment.findFirst({
    where: { razorpayId: razorpay_order_id },
  });

  if (!payment) {
    return next(new AppError('Payment record not found', 404));
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: 'COMPLETED' },
  });

  res.status(200).json({
    success: true,
    message: 'Payment verified successfully',
  });
});
