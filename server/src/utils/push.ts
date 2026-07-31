import webpush from 'web-push';
import { env } from './env';

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

export const sendPushNotification = async (subscription: any, payload: string) => {
  if (!subscription) return false;
  
  try {
    await webpush.sendNotification(subscription, payload);
    return true;
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    // If the subscription is no longer valid (e.g. user revoked permission)
    if (error.statusCode === 410 || error.statusCode === 404) {
      return 'INVALID_SUBSCRIPTION';
    }
    return false;
  }
};
