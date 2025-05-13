const nodemailer = require("nodemailer");

if (!process.env.RUNNING_IN_DOCKER) {
  require("dotenv").config();
}

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_HOST,      // e.g., smtp-relay.brevo.com
  port: process.env.BREVO_PORT,      // typically 587
  auth: {
    user: process.env.BREVO_USER,    // your Brevo SMTP user
    pass: process.env.BREVO_PASS,    // your SMTP password
  },
});

/**
 * Sends an email using the shared Brevo SMTP transporter.
 * @param {string} to - Recipient email address
 * @param {string} subject - Subject line of the email
 * @param {string} text - Plain text version
 * @param {string} html - (Optional) HTML version
 */
const sendEmail = async (to, subject, text, html = null) => {
  const mailOptions = {
    from: `"Tutor App" <${process.env.BREVO_SENDER}>`,
    to,
    subject,
    text,
    html: html || `<p>${text}</p>`,  // fallback if no HTML provided
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
  } catch (error) {
    console.error(`❌ Error sending email to ${to}: ${error.message}`);
    throw error;
  }
};

module.exports = { sendEmail };
