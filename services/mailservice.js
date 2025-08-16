const nodemailer = require('nodemailer');
require('dotenv').config();

// Configure transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send OTP to user's email
 * @param {string} to - Recipient's email address
 * @param {string} otp - One-Time Password
 */
exports.sendOTP = async (to, otp) => {
  const mailOptions = {
    from: `"No Reply" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your OTP for Registration',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>🔐 OTP Verification</h2>
        <p>Hello,</p>
        <p>Your OTP for registration is:</p>
        <h1 style="color: #2c3e50;">${otp}</h1>
        <p>This OTP is valid for <strong>10 minutes</strong>.</p>
        <p style="margin-top: 30px;">If you didn’t request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${to}`);
  } catch (error) {
    console.error(`❌ Email send failed to ${to}: ${error.message}`);
    throw new Error('Email service failed');
  }
};
