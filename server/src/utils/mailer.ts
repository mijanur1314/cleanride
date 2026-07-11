import nodemailer from 'nodemailer';

// Ethereal creates fake test accounts automatically for testing
let transporter: nodemailer.Transporter | null = null;

const createTransporter = async () => {
  if (transporter) return transporter;
  
  // Create a test account on the fly
  const testAccount = await nodemailer.createTestAccount();
  
  transporter = nodemailer.createTransport({
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

export const sendEmail = async (to: string, subject: string, html: string) => {
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
    console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    console.log('----------------------------------------');
    
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
