import prisma from '../utils/prisma';
import { logger } from '../utils/logger';
import { sendEmail } from '../utils/email';
import { getIO } from '../socket';

export const processWebhookSync = async (event: string, payload: any) => {
  try {
    if (event === 'payment.captured') {
      const paymentEntity = payload.payment.entity;
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
          
          if (booking.partnerId) {
            await tx.booking.update({
              where: { id: booking.id },
              data: { status: 'PARTNER_ASSIGNED' }
            });
            booking.status = 'PARTNER_ASSIGNED';
          }
      
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
        
        if (booking.partnerId) {
          getIO().to(booking.partnerId).emit('notification', {
            title: 'New Booking Assigned!',
            message: `You have been selected for a new booking by ${booking.user.name}.`,
            type: 'info'
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
    } else if (event === 'subscription.charged') {
      const subscriptionEntity = payload.subscription.entity;
      const razorpaySubscriptionId = subscriptionEntity.id;

      const userSubscription = await prisma.userSubscription.findUnique({
        where: { razorpaySubscriptionId },
        include: { plan: true, user: true }
      });

      if (userSubscription) {
        // If the subscription is already expired, base the new end date on today.
        // If it's still active, extend it by the duration.
        const baseDate = userSubscription.endDate < new Date() ? new Date() : new Date(userSubscription.endDate);
        baseDate.setDate(baseDate.getDate() + userSubscription.plan.durationDays);

        await prisma.userSubscription.update({
          where: { id: userSubscription.id },
          data: { endDate: baseDate, isActive: true }
        });

        getIO().to(userSubscription.userId).emit('notification', {
          title: 'Subscription Renewed',
          message: `Your ${userSubscription.plan.name} subscription has been renewed successfully.`,
          type: 'success'
        });
      }
    }
  } catch (error) {
    logger.error('Error processing webhook sync:', error);
    throw error; // Rethrow so the BullMQ job fails and gets retried
  }
};
