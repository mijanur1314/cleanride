import { env } from '../utils/env';
import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import prisma from '../utils/prisma';
import crypto from 'crypto';
import { razorpay } from '../utils/razorpay';
import { emailQueue } from '../utils/queue';

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

  let order;
  try {
    order = await razorpay.orders.create(options);
  } catch (error: any) {
    console.error('Razorpay Error:', error);
    const msg = error.error?.description || error.description || error.message || 'Failed to create payment order with Razorpay';
    return next(new AppError(msg, 400));
  }

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
    include: { booking: true }
  });

  if (!payment) {
    return next(new AppError('Payment record not found', 404));
  }

  if (payment.status === 'COMPLETED') {
    return res.status(200).json({ success: true, message: 'Payment already verified' });
  }

  if (payment.booking.userId !== req.user!.id) {
    return next(new AppError('Unauthorized access to this booking payment', 403));
  }

  const rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
  if (rzpOrder.status !== 'paid') {
    return next(new AppError('Order is not marked as paid in Razorpay', 400));
  }
  
  const expectedAmountInPaise = Math.round(payment.amount * 100);
  if (rzpOrder.amount !== expectedAmountInPaise) {
    return next(new AppError('Amount mismatch between order and database', 400));
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
    emailQueue.add('paymentSuccess', {
      to: booking.user.email,
      subject: 'CleanRide - Payment Received & Booking Confirmed',
      body: `
        <h2>Payment Successful!</h2>
        <p>Hi ${booking.user.name},</p>
        <p>We have successfully received your payment of <strong>$${payment.amount}</strong> for the <strong>${booking.service.name}</strong> service.</p>
        <p>Your booking (ID: ${booking.id}) is now confirmed. We will assign a service partner shortly.</p>
        <br/>
        <p>Thank you for choosing CleanRide!</p>
      `
    });
  }

    res.status(200).json({
    success: true,
    message: 'Payment verified successfully',
  });
});

export const walletPayment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { bookingId } = req.body;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { payment: true, user: true, service: true },
  });

  if (!booking) return next(new AppError('Booking not found', 404));
  if (booking.userId !== req.user!.id) return next(new AppError('Unauthorized access to booking', 403));
  if (booking.payment?.status === 'COMPLETED') return next(new AppError('Payment already completed', 400));
  
  if (booking.totalAmount === 0) {
    return next(new AppError('Amount is zero, no payment required', 400));
  }

  // Multiply by 100 if you want to store in cents, but booking.totalAmount might already be the exact fiat amount.
  // Wait, in `booking.controller.ts`, finalAmount is calculated. Let's assume Wallet balance is in cents, and totalAmount is in dollars/rupees.
  const amountInCents = Math.round(booking.totalAmount * 100);

  const result = await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId: req.user!.id } });
    if (!wallet || wallet.balance < amountInCents) {
      throw new AppError('Insufficient wallet balance', 400);
    }

    // Debit Wallet
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: -amountInCents,
        type: 'PURCHASE',
        description: `Payment for booking ${booking.id}`
      }
    });

    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: amountInCents } }
    });

    // Create or update payment record
    let payment;
    if (booking.payment) {
      payment = await tx.payment.update({
        where: { id: booking.payment.id },
        data: { razorpayId: 'WALLET', status: 'COMPLETED' },
      });
    } else {
      payment = await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: booking.totalAmount,
          razorpayId: 'WALLET',
          status: 'COMPLETED',
        },
      });
    }

    const updatedBooking = await tx.booking.update({
      where: { id: booking.id },
      data: { status: 'CONFIRMED' }
    });

    return { payment, updatedBooking };
  });

  // Optional: We can dispatch email to emailQueue here
  // sendEmail(...)

  res.status(200).json({
    success: true,
    message: 'Payment completed using Wallet successfully',
    data: result
  });
});
