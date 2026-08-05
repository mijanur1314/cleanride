import { sendEmail as sendEmailViaQueue } from './email';

/**
 * Legacy wrapper for sendEmail.
 * Forwards the request to the BullMQ-enabled sendEmail function.
 */
export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const success = await sendEmailViaQueue({ to, subject, html });
    if (success) {
      console.log('----------------------------------------');
      console.log(`✉️  Email successfully processed for: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log('----------------------------------------');
    }
    return success;
  } catch (error) {
    console.error('Error in legacy sendEmail wrapper:', error);
  }
};
