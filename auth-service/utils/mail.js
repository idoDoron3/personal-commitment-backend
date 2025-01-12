const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: process.env.MAILTRAP_PORT,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

const sendEmail = async (to, resetToken) => {
  const mailOptions = {
    from: '"Your App" <no-reply@yourapp.com>',
    to,
    subject: "Password Reset Request",
    text: `Use this token to reset your password: ${resetToken}`,
    html: `<p>Use this token to reset your password: <strong>${resetToken}</strong></p>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
  } catch (error) {
    console.error(`Error sending email: ${error.message}`);
    throw error;
  }
};

module.exports = sendEmail;
