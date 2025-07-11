const nodemailer = require("nodemailer");

const sendOtpEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"SneakerSpace" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your OTP for SneakerSpace Signup",
    html: `<p>Your OTP is: <b>${otp}</b></p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email}`);
  } catch (error) {
    console.error("❌ Error sending OTP email:", error.message);
    throw error;
  }
};

module.exports = sendOtpEmail;
