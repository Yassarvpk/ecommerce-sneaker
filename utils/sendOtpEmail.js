const nodemailer = require('nodemailer');

  const sendOtpEmail = async (to, message, subject = 'Your OTP for SneakerSpace') => {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text: message,
      };

      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (err) {
      console.error('❌ Email send error:', err.message);
      return { success: false, error: 'Failed to send email' };
    }
  };

  module.exports = sendOtpEmail;