"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Ethereal creates fake test accounts automatically for testing
let transporter = null;
const createTransporter = async () => {
    if (transporter)
        return transporter;
    // Create a test account on the fly
    const testAccount = await nodemailer_1.default.createTestAccount();
    transporter = nodemailer_1.default.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
        },
    });
    return transporter;
};
const sendEmail = async (to, subject, html) => {
    try {
        const mailTransporter = await createTransporter();
        const info = await mailTransporter.sendMail({
            from: '"CleanRide Admin" <admin@cleanride.com>',
            to,
            subject,
            html,
        });
        console.log('----------------------------------------');
        console.log(`✉️  Email sent to: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Preview URL: ${nodemailer_1.default.getTestMessageUrl(info)}`);
        console.log('----------------------------------------');
        return info;
    }
    catch (error) {
        console.error('Error sending email:', error);
    }
};
exports.sendEmail = sendEmail;
