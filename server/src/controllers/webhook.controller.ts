import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../utils/prisma';
import { env } from '../utils/env';
import { logger } from '../utils/logger';
import { sendEmail } from '../utils/email';
import { getIO } from '../socket';

export const handleRazorpayWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const secret = env.RAZORPAY_KEY_SECRET; // Or your specific Webhook Secret if you have one

    if (!signature || !secret) {
      return res.status(400).send('Invalid Signature or Secret');
    }

    // Verify Signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (expectedSignature !== signature) {
      logger.error('Invalid Razorpay Webhook Signature');
      return res.status(400).send('Invalid signature');
    }

    const event = req.body.event;
    
    if (event === 'payment.captured') {
      const paymentEntity = req.body.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      
      const payment = await prisma.payment.findFirst({
        where: { razorpayId: razorpayOrderId }
      });

      if (payment && payment.status !== 'COMPLETED') {
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

        if (booking.userId) {
          getIO().to(booking.userId).emit('notification', {
            title: 'Payment Confirmed',
            message: 'Your payment was successful and booking is confirmed.',
            type: 'success'
          });
        }

        // Send Email asynchronously (do not await)
        if (booking && booking.user) {
          sendEmail({
            to: booking.user.email,
            subject: 'CleanRide - Payment Received & Booking Confirmed',
            html: `
              <h2>Payment Successful!</h2>
              <p>Hi ${booking.user.name},</p>
              <p>We have successfully received your payment of <strong>₹${payment.amount}</strong> for the <strong>${booking.service.name}</strong> service.</p>
              <p>Your booking (ID: ${booking.id}) is now confirmed. We will assign a service partner shortly.</p>
              <br/>
              <p>Thank you for choosing CleanRide!</p>
            `
          }).catch(err => logger.error('Failed to send webhook confirmation email:', err));
        }
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    logger.error('Webhook Error:', error);
    res.status(500).send('Webhook Error');
  }
};
