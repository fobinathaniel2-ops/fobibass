// ======================================
// mailer.js
// Nodemailer transport + a single sendMail() helper used by every
// email-sending route in this backend.
// ======================================

const nodemailer = require("nodemailer");

const hasSmtpCredentials = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
const buildFromAddress = () => {
  const displayName = process.env.MAIL_FROM || process.env.SITE_NAME || "FOBIbass";
  if (displayName.includes("<") && displayName.includes(">")) return displayName;
  if (process.env.SMTP_USER) return `${displayName} <${process.env.SMTP_USER}>`;
  return displayName;
};
const transporter = hasSmtpCredentials
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_SECURE || "true") === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

if (hasSmtpCredentials) {
  transporter.verify((error) => {
    if (error) {
      console.error("[mailer] SMTP connection failed:", error.message);
    } else {
      console.log("[mailer] SMTP connection ready");
    }
  });
} else {
  console.warn("[mailer] SMTP is not configured. Email sending will be disabled until SMTP_USER and SMTP_PASS are set.");
}

/**
 * @param {Object} opts
 * @param {string} opts.to
 * @param {string} opts.subject
 * @param {string} opts.html
 * @param {Array}  [opts.attachments]
 */
async function sendMail({ to, subject, html, attachments }) {
  if (!transporter) {
    const error = new Error("SMTP is not configured. Add SMTP_USER and SMTP_PASS to backend/.env to enable email sending.");
    error.code = "SMTP_NOT_CONFIGURED";
    throw error;
  }

  return transporter.sendMail({
    from: buildFromAddress(),
    to,
    subject,
    html,
    attachments,
  });
}

module.exports = { sendMail };

