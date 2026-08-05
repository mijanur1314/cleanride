import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../utils/env';
import prisma from '../utils/prisma';
import { emailQueue } from '../queues/email.queue';

const redisUrl = env.REDIS_URL;
const connection = new IORedis(redisUrl || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const payoutWorker = new Worker('payoutQueue', async (job) => {
  console.log(`[PayoutWorker] Processing job ${job.name} (ID: ${job.id})`);

  // 1. Fetch all COMPLETED bookings where payoutProcessed == false
  const pendingPayoutBookings = await prisma.booking.findMany({
    where: {
      status: 'COMPLETED',
      payoutProcessed: false,
      partnerId: { not: null }
    },
    include: {
      partner: true
    }
  });

  if (pendingPayoutBookings.length === 0) {
    console.log('[PayoutWorker] No pending payouts found.');
    return { success: true, processed: 0 };
  }

  // 2. Group by partnerId
  const partnerPayouts: Record<string, { totalAmount: number, bookingIds: string[], partnerEmail: string, partnerName: string }> = {};

  for (const booking of pendingPayoutBookings) {
    if (!booking.partnerId) continue;
    
    if (!partnerPayouts[booking.partnerId]) {
      partnerPayouts[booking.partnerId] = {
        totalAmount: 0,
        bookingIds: [],
        partnerEmail: booking.partner?.email || '',
        partnerName: booking.partner?.name || 'Partner'
      };
    }
    
    // Partner gets 70% of the total amount
    const partnerCut = booking.totalAmount * 0.70;
    
    partnerPayouts[booking.partnerId].totalAmount += partnerCut;
    partnerPayouts[booking.partnerId].bookingIds.push(booking.id);
  }

  // 3. Process payouts using a transaction
  let processedPartners = 0;
  
  for (const [partnerId, data] of Object.entries(partnerPayouts)) {
    try {
      await prisma.$transaction(async (tx) => {
        // Ensure wallet exists
        let wallet = await tx.wallet.findUnique({ where: { userId: partnerId } });
        if (!wallet) {
          wallet = await tx.wallet.create({ data: { userId: partnerId, balance: 0 } });
        }

        const amountInCents = Math.round(data.totalAmount * 100);

        // Update Wallet
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: amountInCents } }
        });

        // Create Transaction Record
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: amountInCents,
            type: 'PAYOUT',
            description: `Daily payout for ${data.bookingIds.length} completed booking(s)`
          }
        });

        // Mark bookings as processed
        await tx.booking.updateMany({
          where: { id: { in: data.bookingIds } },
          data: { payoutProcessed: true }
        });
      });

      // Notify Partner (We use the queue created elsewhere, so we just add to it directly, but wait - I will import emailQueue)
      
      processedPartners++;
    } catch (err) {
      console.error(`[PayoutWorker] Error processing payout for partner ${partnerId}:`, err);
    }
  }

  console.log(`[PayoutWorker] Successfully processed payouts for ${processedPartners} partners.`);
  return { success: true, processedPartners };

}, { connection });

payoutWorker.on('completed', job => console.log(`[PayoutWorker] Job ${job.id} completed successfully`));
payoutWorker.on('failed', (job, err) => console.error(`[PayoutWorker] Job ${job?.id} failed: ${err?.message}`));
