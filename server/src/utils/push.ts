import webpush from 'web-push';
import { env } from './env';
import { pushQueue } from '../queues/push.queue';
import { logger } from './logger';

// Initialize web-push with VAPID keys
if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@cleanride.com',
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('⚠️ Web Push VAPID keys are missing. Push notifications will not work.');
}

/**
 * Synchronous push sending function.
 * Used by the BullMQ worker, or directly as a fallback if the queue is unavailable.
 */
export const sendPushSync = async (subscription: webpush.PushSubscription, payload: string) => {
  if (!subscription) return false;
  
  try {
    await webpush.sendNotification(subscription, payload);
    return true;
  } catch (error: unknown) {
    console.error('Error sending push notification synchronously:', error);
    // If the subscription is no longer valid (e.g. user revoked permission)
    if (typeof error === 'object' && error !== null && 'statusCode' in error) {
      if ((error as { statusCode: number }).statusCode === 410 || (error as { statusCode: number }).statusCode === 404) {
        return 'INVALID_SUBSCRIPTION';
      }
    }
    return false;
  }
};

/**
 * Primary export for controllers.
 * Attempts to queue the push in BullMQ. If it fails, falls back to synchronous send.
 */
export const sendPushNotification = async (subscription: webpush.PushSubscription, payload: string) => {
  if (pushQueue) {
    try {
      await pushQueue.add('sendPushJob', { subscription, payload });
      logger.info('Queued push notification job');
      return true; // Successfully queued
    } catch (error) {
      logger.error('Failed to queue push notification, falling back to sync send:', error);
      return await sendPushSync(subscription, payload);
    }
  } else {
    logger.warn('Push Queue is not available. Sending push synchronously.');
    return await sendPushSync(subscription, payload);
  }
};
