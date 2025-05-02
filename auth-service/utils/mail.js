// const nodemailer = require("nodemailer");
// require("dotenv").config();

// const transporter = nodemailer.createTransport({
//   host: process.env.MAILTRAP_HOST,
//   port: process.env.MAILTRAP_PORT,
//   auth: {
//     user: process.env.MAILTRAP_USER,
//     pass: process.env.MAILTRAP_PASS,
//   },
// });

// const sendEmail = async (to, resetToken) => {
//   const mailOptions = {
//     from: '"Your App" <no-reply@yourapp.com>',
//     to,
//     subject: "Password Reset Request",
//     text: `Use this token to reset your password: ${resetToken}`,
//     html: `<p>Use this token to reset your password: <strong>${resetToken}</strong></p>`,
//   };

//   try {
//     const info = await transporter.sendMail(mailOptions);
//     console.log(`Email sent: ${info.messageId}`);
//   } catch (error) {
//     console.error(`Error sending email: ${error.message}`);
//     throw error;
//   }
// };

// module.exports = sendEmail;

const nodemailer = require("nodemailer");
require("dotenv").config();

// הגדרת transporter לפי פרטי SMTP של Brevo
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_HOST, // למשל: smtp-relay.brevo.com
  port: process.env.BREVO_PORT, // לרוב: 587
  auth: {
    user: process.env.BREVO_USER, // שם המשתמש שקיבלת (נראה כמו xxxx@smtp-brevo.com)
    pass: process.env.BREVO_PASS, // הסיסמה שהוצאת ב-SMTP settings
  },
});

const sendEmail = async (to, resetToken) => {
  const mailOptions = {
    from: `"Tutor App" <${process.env.BREVO_SENDER}>`, // הכתובת שיאושרה על ידך (למשל: tutor.project.app@gmail.com)
    to,
    subject: "Password Reset Request",
    text: `Use this token to reset your password: ${resetToken}`,
    html: `<p>Use this token to reset your password: <strong>${resetToken}</strong></p>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${info.messageId}`);
  } catch (error) {
    console.error(`❌ Error sending email: ${error.message}`);
    throw error;
  }
};

module.exports = sendEmail;
