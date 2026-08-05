import { env } from '../utils/env';
import nodemailer from 'nodemailer';
import { emailQueue } from '../queues/email.queue';
import { logger } from './logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const createTransporter = () => {
  // If SMTP is not fully configured, you can use ethereal email or console log for testing
  return nodemailer.createTransport({
    host: env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(env.SMTP_PORT || '587'),
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
};

/**
 * Synchronous email sending function. 
 * Used by the BullMQ worker, or directly as a fallback if the queue is unavailable.
 */
export const sendEmailSync = async (options: EmailOptions) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"CleanRide Support" <${env.SMTP_FROM_EMAIL || env.SMTP_USER || 'noreply@cleanride.com'}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.to}. Message ID: ${info.messageId}`);
    
    // If using ethereal email for testing, log the preview URL
    if (env.SMTP_HOST === 'smtp.ethereal.email') {
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return true;
  } catch (error) {
    console.error(`Failed to send email synchronously to ${options.to}:`, error);
    // We don't throw an error here to prevent the main transaction from failing just because email failed
    return false;
  }
};

/**
 * Primary export for controllers.
 * Attempts to queue the email in BullMQ. If it fails (e.g., Redis down),
 * it falls back to sending the email synchronously.
 */
export const sendEmail = async (options: EmailOptions) => {
  if (emailQueue) {
    try {
      await emailQueue.add('sendEmailJob', options);
      logger.info(`Queued email job for ${options.to}`);
      return true; // Successfully queued
    } catch (error) {
      logger.error('Failed to queue email, falling back to sync send:', error);
      // Fallback
      return await sendEmailSync(options);
    }
  } else {
    // Redis is not configured, fall back to sync immediately
    logger.warn('Email Queue is not available. Sending email synchronously.');
    return await sendEmailSync(options);
  }
};
