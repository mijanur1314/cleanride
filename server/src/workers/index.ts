import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';
import { sendEmailSync } from '../utils/email';
import { sendPushSync } from '../utils/push';
import { processWebhookSync } from '../services/webhook.service';
import { dispatchWorker } from './dispatch.worker';
import prisma from '../utils/prisma';
import { Queue } from 'bullmq';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const redisUrl = process.env.REDIS_URL;
const connection = new IORedis(redisUrl || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export function initializeWorkers() {
  if (!redisUrl) {
    console.warn('REDIS_URL is not set. Workers are not started.');
    return;
  }

  console.log('Initializing BullMQ Workers...');

  // --- Email Worker ---
  const emailWorker = new Worker('emailQueue', async job => {
    console.log(`Processing email job: ${job.name} (ID: ${job.id})`);
    
    const { to, subject, html, body } = job.data;
    
    const emailOptions = {
      to,
      subject,
      html: html || body,
    };
    
    const success = await sendEmailSync(emailOptions);
    
    if (!success) {
      throw new Error(`Failed to send email to ${to}`);
    }
    
    return { success: true };
  }, { connection });

  emailWorker.on('completed', job => console.log(`[EmailWorker] Job ${job.id} completed successfully`));
  emailWorker.on('failed', (job, err) => console.error(`[EmailWorker] Job ${job?.id} failed: ${err.message}`));

  // --- Push Notification Worker ---
  const pushWorker = new Worker('pushQueue', async job => {
    console.log(`Processing push job: ${job.name} (ID: ${job.id})`);
    
    const { subscription, payload } = job.data;
    
    const result = await sendPushSync(subscription, payload);
    
    if (result === false) {
      throw new Error(`Failed to send push notification`);
    } else if (result === 'INVALID_SUBSCRIPTION') {
      console.warn(`[PushWorker] Invalid subscription detected for job ${job.id}. Cleanup needed.`);
      // Note: Ideally, you'd trigger a DB cleanup here to remove this stale subscription
    }
    
    return { success: true };
  }, { connection });

  pushWorker.on('completed', job => console.log(`[PushWorker] Job ${job.id} completed successfully`));
  pushWorker.on('failed', (job, err) => console.error(`[PushWorker] Job ${job?.id} failed: ${err.message}`));

  // --- Webhook Processing Worker ---
  const webhookWorker = new Worker('webhookQueue', async job => {
    console.log(`Processing webhook job: ${job.name} (Event: ${job.data.event}) (ID: ${job.id})`);
    
    const { event, payload } = job.data;
    
    await processWebhookSync(event, payload);
    
    return { success: true };
  }, { connection });

  webhookWorker.on('completed', job => console.log(`[WebhookWorker] Job ${job.id} completed successfully`));
  webhookWorker.on('failed', (job, err) => console.error(`[WebhookWorker] Job ${job?.id} failed: ${err.message}`));

  // --- Loyalty Worker (Placeholder) ---
  const loyaltyWorker = new Worker('loyaltyQueue', async job => {
    console.log(`Processing loyalty job: ${job.name} (ID: ${job.id})`);
    return { success: true };
  }, { connection });

  // --- Payout Worker ---
  const payoutWorker = new Worker('payoutQueue', async job => {
    console.log(`[PayoutWorker] Processing job ${job.name} (ID: ${job.id})`);

    const pendingPayoutBookings = await prisma.booking.findMany({
      where: { status: 'COMPLETED', payoutProcessed: false, partnerId: { not: null } },
      include: { partner: true }
    });

    if (pendingPayoutBookings.length === 0) {
      console.log('[PayoutWorker] No pending payouts found.');
      return { success: true, processed: 0 };
    }

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
      const partnerCut = booking.totalAmount * 0.70;
      partnerPayouts[booking.partnerId].totalAmount += partnerCut;
      partnerPayouts[booking.partnerId].bookingIds.push(booking.id);
    }

    let processedPartners = 0;
    for (const [partnerId, data] of Object.entries(partnerPayouts)) {
      try {
        await prisma.$transaction(async (tx) => {
          let wallet = await tx.wallet.findUnique({ where: { userId: partnerId } });
          if (!wallet) {
            wallet = await tx.wallet.create({ data: { userId: partnerId, balance: 0 } });
          }
          const amountInCents = Math.round(data.totalAmount * 100);
          await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: amountInCents } } });
          await tx.walletTransaction.create({
            data: { walletId: wallet.id, amount: amountInCents, type: 'PAYOUT', description: `Daily payout for ${data.bookingIds.length} completed booking(s)` }
          });
          await tx.booking.updateMany({ where: { id: { in: data.bookingIds } }, data: { payoutProcessed: true } });
        });
        
        // Notify via email queue
        if (data.partnerEmail) {
          const emailQueue = new Queue('emailQueue', { connection });
          await emailQueue.add('payoutNotification', {
            to: data.partnerEmail,
            subject: 'Your Daily Earnings - CleanRide',
            html: `<h1>You've been paid!</h1>
                   <p>Hi ${data.partnerName},</p>
                   <p>We've successfully processed your payout for ${data.bookingIds.length} completed wash(es) today.</p>
                   <p><strong>$${data.totalAmount.toFixed(2)}</strong> has been added to your CleanRide Wallet.</p>
                   <p>Thank you for your hard work!</p>`
          });
        }
        processedPartners++;
      } catch (err) {
        console.error(`[PayoutWorker] Error processing payout for partner ${partnerId}:`, err);
      }
    }

    console.log(`[PayoutWorker] Successfully processed payouts for ${processedPartners} partners.`);
    return { success: true, processedPartners };
  }, { connection });

  payoutWorker.on('completed', job => console.log(`[PayoutWorker] Job ${job.id} completed successfully`));
  payoutWorker.on('failed', (job, err) => { console.log(`[Payout Worker] Job ${job?.id} failed with error ${err.message}`);
  });

  // Ensure dispatch worker is active
  if (dispatchWorker) {
    console.log('[Workers] Dispatch Worker is active');
  }

  console.log('[Workers] Initialization complete');
}
