// ======================================
// emailTemplates.js
// HTML email bodies for FOBIbass. Built with tables and inline styles so they
// render the same in Gmail, Outlook and phone mail apps.
// The logo is loaded from the live website: Gmail blocks inline base64 images,
// which is why the previous version showed a broken logo.
// ======================================

const SITE_URL = String(process.env.FRONTEND_URL || "https://fobibass.vercel.app").replace(/\/+$/, "");
const LOGO_URL = `${SITE_URL}/main-logo.png`;

const GOLD = "#D4AF37";
const BLACK = "#0B0B0B";
const PAGE = "#0B0D10";
const CARD = "#14181D";
const LINE = "#262C34";
const WHITE = "#FFFFFF";
const TEXT = "#E8EDF2";
const MUTED = "#9AA5B1";
const FONT = "'Segoe UI',Helvetica,Arial,sans-serif";

const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

function wrapper(innerHtml) {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAGE};">
  <tr>
    <td align="center" style="padding:28px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:${CARD};border:1px solid ${LINE};border-radius:14px;overflow:hidden;">
        <tr>
          <td align="center" style="background:#000000;padding:26px 24px 22px;border-bottom:3px solid ${GOLD};">
            <img src="${LOGO_URL}" alt="FOBIbass" width="120" style="display:block;width:120px;max-width:100%;height:auto;border:0;outline:none;text-decoration:none;">
          </td>
        </tr>
        <tr>
          <td style="padding:32px 30px 28px;font-family:${FONT};color:${TEXT};">
            ${innerHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:18px 30px;border-top:1px solid ${LINE};font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTED};text-align:center;">
            FOBIbass &middot; Accra, Oyarifa, Ankonam<br>
            Questions? Just reply to this email.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

function eyebrow(text) {
  return `<div style="margin:0 0 10px;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${GOLD};">${esc(text)}</div>`;
}

function heading(text) {
  return `<h1 style="margin:0 0 14px;font-size:26px;line-height:1.25;font-weight:700;color:${WHITE};">${esc(text)}</h1>`;
}

function paragraph(html, extra = "") {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${TEXT};${extra}">${html}</p>`;
}

function button(url, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 4px;"><tr><td style="border-radius:8px;background:${GOLD};"><a href="${esc(url)}" style="display:inline-block;padding:13px 26px;font-family:${FONT};font-size:14px;font-weight:700;color:${BLACK};text-decoration:none;border-radius:8px;">${esc(label)}</a></td></tr></table>`;
}

function infoRow(label, value) {
  return `<tr>
    <td style="padding:10px 0;width:38%;border-bottom:1px solid ${LINE};font-size:13px;font-weight:600;color:${MUTED};vertical-align:top;">${esc(label)}</td>
    <td style="padding:10px 0;border-bottom:1px solid ${LINE};font-size:14px;color:${WHITE};vertical-align:top;">${esc(value)}</td>
  </tr>`;
}

function infoTable(rows) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 6px;font-family:${FONT};">${rows.join("")}</table>`;
}

function otpEmailTemplate({ name, otp, expiryMinutes }) {
  return wrapper(`
    ${eyebrow("Secure access")}
    ${heading("Password reset")}
    ${paragraph(`Hi ${esc(name || "there")}, a password reset was requested for your FOBIbass client portal. Use the code below to continue.`)}
    <div style="margin:8px 0 18px;padding:18px;border:1px solid ${GOLD};border-radius:10px;background:${PAGE};font-size:32px;font-weight:700;letter-spacing:10px;text-align:center;color:${WHITE};">${esc(otp)}</div>
    ${paragraph(`This code expires in ${esc(expiryMinutes)} minutes. If you did not request this reset, you can safely ignore this message.`, `font-size:13px;color:${MUTED};`)}
  `);
}

function bookingConfirmationTemplate({ name, email, eventType, eventDate, location, loginUrl, tempPassword, googleCalendarLink, icsDownloadUrl }) {
  const existingAccount = !tempPassword || tempPassword === "Your existing password";
  return wrapper(`
    ${eyebrow("Booking received")}
    ${heading(`Thank you, ${name}`)}
    ${paragraph("Your booking request has been received and is now being reviewed. We will confirm with you shortly.")}

    ${infoTable([infoRow("Event type", eventType), infoRow("Date", eventDate), infoRow("Location", location)])}

    <div style="margin:24px 0 0;padding:18px 20px;border:1px solid ${LINE};border-radius:10px;background:${PAGE};">
      <div style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${GOLD};">Your client portal</div>
      ${paragraph(`Sign in with <strong style="color:${WHITE};">${esc(email)}</strong>.`, "margin-bottom:8px;font-size:14px;")}
      ${existingAccount
        ? paragraph("Use the password you already have for this account.", `margin-bottom:0;font-size:14px;color:${MUTED};`)
        : `${paragraph(`Temporary password: <strong style="color:${GOLD};font-size:16px;">${esc(tempPassword)}</strong>`, "margin-bottom:6px;font-size:14px;")}
           ${paragraph("You will be asked to change it after your first login. Please keep it private.", `margin-bottom:0;font-size:12px;color:${MUTED};`)}`}
      ${button(loginUrl, "Open client portal")}
    </div>

    <p style="margin:22px 0 0;font-size:13px;line-height:1.7;color:${MUTED};">
      Add to calendar:
      <a href="${esc(googleCalendarLink)}" style="color:${GOLD};text-decoration:underline;">Google Calendar</a>
      &nbsp;&middot;&nbsp;
      <a href="${esc(icsDownloadUrl)}" style="color:${GOLD};text-decoration:underline;">Download .ics</a>
    </p>
  `);
}

function adminNewBookingTemplate({ name, email, phone, eventType, eventDate, location, budget, message, managerUrl }) {
  return wrapper(`
    ${eyebrow("New request")}
    ${heading("New booking request")}
    ${paragraph("A new enquiry was submitted through the FOBIbass booking form.")}

    ${infoTable([
      infoRow("Client name", name),
      infoRow("Email", email),
      infoRow("Phone", phone || "—"),
      infoRow("Event type", eventType),
      infoRow("Date", eventDate),
      infoRow("Location", location),
      infoRow("Budget", budget || "—"),
    ])}

    ${message ? `<div style="margin:20px 0 0;padding:14px 16px;border-left:3px solid ${GOLD};background:${PAGE};">
      <div style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${GOLD};">Message</div>
      <div style="font-size:14px;line-height:1.7;color:${TEXT};">${esc(message)}</div>
    </div>` : ""}

    ${button(managerUrl, "Open manager dashboard")}
  `);
}

function adminAttendanceConfirmTemplate({ clientName, eventType, eventDate, confirmUrl }) {
  return wrapper(`
    ${eyebrow("Attendance review")}
    ${heading("Attendance confirmation")}
    ${paragraph(`The event below has now passed. Please confirm whether <strong style="color:${WHITE};">${esc(clientName)}</strong> attended.`)}
    ${infoTable([infoRow("Event", eventType), infoRow("Date", eventDate)])}
    ${paragraph("If confirmed, the client's portal access will be closed automatically.", `margin-top:14px;font-size:13px;color:${MUTED};`)}
    ${button(confirmUrl, "Yes, confirmed")}
  `);
}

function accessClosedTemplate({ name, eventType }) {
  return wrapper(`
    ${eyebrow("Event completed")}
    ${heading(`Thank you, ${name}`)}
    ${paragraph(`Your event, <strong style="color:${WHITE};">${esc(eventType)}</strong>, has been marked as completed and your client portal access is now closed.`)}
    ${paragraph("It was a pleasure working with you. We hope to play for you again soon.", `color:${MUTED};font-size:14px;`)}
  `);
}

function adminPasswordResetTemplate({ resetLink }) {
  return wrapper(`
    ${eyebrow("Manager access")}
    ${heading("Manager password reset")}
    ${paragraph("A password reset was requested for the FOBIbass manager dashboard. Use the button below to continue.")}
    ${button(resetLink, "Reset password")}
    ${paragraph("This link expires in 1 hour. If you did not request this reset, you can safely ignore this message.", `margin-top:18px;font-size:13px;color:${MUTED};`)}
  `);
}

module.exports = {
  otpEmailTemplate,
  bookingConfirmationTemplate,
  adminNewBookingTemplate,
  adminAttendanceConfirmTemplate,
  accessClosedTemplate,
  adminPasswordResetTemplate,
};
