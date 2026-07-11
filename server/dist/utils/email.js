"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const createTransporter = () => {
    // If SMTP is not fully configured, you can use ethereal email or console log for testing
    return nodemailer_1.default.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: parseInt(process.env.SMTP_PORT || '587'),
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};
const sendEmail = async (options) => {
    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: `"CleanRide Support" <${process.env.SMTP_USER || 'noreply@cleanride.com'}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
        };
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${options.to}. Message ID: ${info.messageId}`);
        // If using ethereal email for testing, log the preview URL
        if (process.env.SMTP_HOST === 'smtp.ethereal.email') {
            console.log(`Preview URL: ${nodemailer_1.default.getTestMessageUrl(info)}`);
        }
        return true;
    }
    catch (error) {
        console.error(`Failed to send email to ${options.to}:`, error);
        // We don't throw an error here to prevent the main transaction (like payment verification) from failing just because email failed
        return false;
    }
};
exports.sendEmail = sendEmail;
