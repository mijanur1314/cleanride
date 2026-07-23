import { env } from '../utils/env';
import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { sendEmail } from '../utils/email';

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export const createOrder = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { bookingId } = req.body;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true },
  });

  if (!booking) return next(new AppError('Booking not found', 404));
  if (booking.userId !== req.user!.id) return next(new AppError('Unauthorized access to booking', 403));
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
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, _bookingId } = req.body;

  if (!env.RAZORPAY_KEY_SECRET) {
    return next(new AppError('Payment gateway is not configured securely', 500));
  }

  const generatedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
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

  const result = await prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: { status: 'COMPLETED' },
    });

    const booking = await tx.booking.update({
      where: { id: payment.bookingId },
      data: { status: 'CONFIRMED' },
      include: { user: true, service: true }
    });

    return { updatedPayment, booking };
  });

  const { booking } = result;

  if (booking && booking.user) {
    sendEmail({
      to: booking.user.email,
      subject: 'CleanRide - Payment Received & Booking Confirmed',
      html: `
        <h2>Payment Successful!</h2>
        <p>Hi ${booking.user.name},</p>
        <p>We have successfully received your payment of <strong>$${payment.amount}</strong> for the <strong>${booking.service.name}</strong> service.</p>
        <p>Your booking (ID: ${booking.id}) is now confirmed. We will assign a service partner shortly.</p>
        <br/>
        <p>Thank you for choosing CleanRide!</p>
      `
    }).catch(err => console.error('Failed to send email:', err));
  }

  res.status(200).json({
    success: true,
    message: 'Payment verified successfully',
  });
});
