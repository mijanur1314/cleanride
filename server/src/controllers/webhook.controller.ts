import { Request, Response } from 'express';
import crypto from 'crypto';
import { env } from '../utils/env';
import { logger } from '../utils/logger';
import { webhookQueue } from '../queues/webhook.queue';
import { processWebhookSync } from '../services/webhook.service';

export const handleRazorpayWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const secret = env.RAZORPAY_WEBHOOK_SECRET || env.RAZORPAY_KEY_SECRET;

    if (!signature || !secret || !req.rawBody) {
      return res.status(400).send('Invalid Signature, Secret or Raw Body');
    }

    // Verify Signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(req.rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      logger.error('Invalid Razorpay Webhook Signature');
      return res.status(400).send('Invalid signature');
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (webhookQueue) {
      // Offload processing to BullMQ
      await webhookQueue.add('processWebhook', { event, payload, signature });
      logger.info(`Webhook event ${event} queued successfully.`);
    } else {
      // Fallback if Redis is not configured
      logger.warn('Webhook Queue unavailable, processing synchronously.');
      await processWebhookSync(event, payload);
    }

    // Immediately return 200 OK so Razorpay doesn't timeout
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    logger.error('Webhook Error:', error);
    res.status(500).send('Webhook Error');
  }
};
