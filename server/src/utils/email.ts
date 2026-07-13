import { env } from '../utils/env';
import nodemailer from 'nodemailer';

interface EmailOptions {
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

export const sendEmail = async (options: EmailOptions) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"CleanRide Support" <${env.SMTP_USER || 'noreply@cleanride.com'}>`,
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
    console.error(`Failed to send email to ${options.to}:`, error);
    // We don't throw an error here to prevent the main transaction (like payment verification) from failing just because email failed
    return false;
  }
};
