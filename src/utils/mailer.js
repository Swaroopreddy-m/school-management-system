const nodemailer = require('nodemailer');
const prisma = require('../config/db');

/**
 * Send an email using configured SMTP settings or falls back to simulated console logs.
 * @param {Object} mailOptions 
 * @param {string} mailOptions.to
 * @param {string} mailOptions.subject
 * @param {string} mailOptions.html
 */
async function sendEmail({ to, subject, html }) {
  try {
    // 1. Fetch settings from DB
    const settings = await prisma.platformSettings.findFirst().catch(() => null);
    
    const host = (settings && settings.smtpHost) || process.env.SMTP_HOST;
    const port = (settings && settings.smtpPort) || process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    // 2. If SMTP parameters are missing, simulate email and return
    if (!host || !user || !pass) {
      console.log(`\n==================================================`);
      console.log(`[MAILER SANDBOX] Simulated Email Onboarding`);
      console.log(`To:      ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content:\n${html.replace(/<[^>]*>/g, '')}`); // Strip tags for readability
      console.log(`==================================================\n`);
      return { simulated: true, to, subject };
    }

    // 3. Create SMTP transporter
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port, 10) || 587,
      secure: parseInt(port, 10) === 465,
      auth: { user, pass }
    });

    const info = await transporter.sendMail({
      from: `"SaaS EduPortal" <${user}>`,
      to,
      subject,
      html
    });

    console.log(`[MAILER] Real email sent successfully to ${to}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[MAILER ERROR] Failed to send email to ${to}:`, error);
    // Silent fallback to console log for resilience
    console.log(`[MAILER FALLBACK] Simulated email output after failure: To: ${to}, Subject: ${subject}`);
    return { error: true, message: error.message };
  }
}

module.exports = { sendEmail };
