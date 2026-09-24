// ======================================
// emailTemplates.js
// HTML email bodies, styled to match the FOBIbass brand and designed for a
// clean, premium, real-company presentation.
// ======================================

const fs = require("fs");
const path = require("path");

const logoPath = path.join(__dirname, "..", "..", "main-logo.png");
const logoDataUri = fs.existsSync(logoPath)
  ? `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`
  : "https://fobibass.com/main-logo.png";

const GOLD = "#D4AF37";
const GOLD_SOFT = "#F3D989";
const BLACK = "#0B0B0B";
const CARD = "#14181D";
const PANEL = "#0E1216";
const WHITE = "#FFFFFF";
const TEXT = "#EDF2F7";
const MUTED = "#B7C0CC";
const SOFT = "#8A93A0";

function brandHighlights() {
  return `
    <div style="display:flex;flex-wrap:wrap;gap:12px;margin:0 0 22px;padding:0;">
      <div style="flex:1 1 0;min-width:120px;padding:14px 12px;border-radius:12px;border:1px solid rgba(212,175,55,.25);background:linear-gradient(180deg, rgba(212,175,55,.08), rgba(255,255,255,.02));">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${GOLD};box-shadow:0 0 0 4px rgba(212,175,55,.14);"></span>
          <span style="color:${GOLD};font-size:10px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;">Live</span>
        </div>
        <div style="color:${TEXT};font-size:13px;font-weight:700;line-height:1.4;">Performance-ready booking</div>
      </div>
      <div style="flex:1 1 0;min-width:120px;padding:14px 12px;border-radius:12px;border:1px solid rgba(212,175,55,.25);background:linear-gradient(180deg, rgba(212,175,55,.08), rgba(255,255,255,.02));">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${GOLD};box-shadow:0 0 0 4px rgba(212,175,55,.14);"></span>
          <span style="color:${GOLD};font-size:10px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;">Studio</span>
        </div>
        <div style="color:${TEXT};font-size:13px;font-weight:700;line-height:1.4;">Professional sessions</div>
      </div>
      <div style="flex:1 1 0;min-width:120px;padding:14px 12px;border-radius:12px;border:1px solid rgba(212,175,55,.25);background:linear-gradient(180deg, rgba(212,175,55,.08), rgba(255,255,255,.02));">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${GOLD};box-shadow:0 0 0 4px rgba(212,175,55,.14);"></span>
          <span style="color:${GOLD};font-size:10px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;">Worship</span>
        </div>
        <div style="color:${TEXT};font-size:13px;font-weight:700;line-height:1.4;">Faith-filled sound</div>
      </div>
    </div>
  `;
}

function wrapper(innerHtml) {
  return `
  <div style="background:linear-gradient(135deg, #070909 0%, #11161a 45%, #1a1f26 100%);padding:32px 16px;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;background:linear-gradient(180deg, ${CARD} 0%, ${PANEL} 100%);border:1px solid rgba(212,175,55,.35);border-radius:18px;overflow:hidden;box-shadow:0 20px 48px rgba(0,0,0,.35);">
      <div style="padding:22px 24px;border-bottom:1px solid rgba(212,175,55,.24);background:linear-gradient(90deg, rgba(212,175,55,.12), rgba(255,255,255,.02));">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div style="display:flex;align-items:center;gap:14px;">
            <div style="display:flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg, rgba(243,217,137,.38), rgba(212,175,55,.15));border:1px solid rgba(212,175,55,.45);box-shadow:inset 0 0 0 1px rgba(255,255,255,.05), 0 10px 20px rgba(212,175,55,.12);">
              <span style="display:inline-block;width:18px;height:18px;background:linear-gradient(135deg, ${GOLD_SOFT}, ${GOLD});border-radius:5px;transform:rotate(45deg);box-shadow:0 0 0 1px rgba(255,255,255,.08);"></span>
            </div>
            <div>
              <img src="${logoDataUri}" alt="FOBIbass logo" style="display:block;height:36px;width:auto;max-width:190px;border:0;outline:none;text-decoration:none;" />
              <div style="color:${MUTED};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-top:6px;">Live • Studio • Worship</div>
            </div>
          </div>
          <span style="display:inline-block;padding:7px 11px;border-radius:999px;background:linear-gradient(180deg, rgba(255,255,255,.04), rgba(212,175,55,.04));border:1px solid rgba(212,175,55,.25);color:${MUTED};font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;">Professional booking</span>
        </div>
      </div>

      <div style="padding:18px 24px 0;background:rgba(255,255,255,.01);border-bottom:1px solid rgba(212,175,55,.12);">
        ${brandHighlights()}
      </div>

      <div style="height:1px;background:linear-gradient(90deg, rgba(212,175,55,0), rgba(212,175,55,.75), rgba(212,175,55,0));margin:0 24px;"></div>

      <div style="padding:30px 28px;background-image:repeating-linear-gradient(to bottom, rgba(255,255,255,.012), rgba(255,255,255,.012) 1px, transparent 1px, transparent 8px);">
        ${innerHtml}
      </div>

      <div style="padding:18px 24px;border-top:1px solid rgba(212,175,55,.20);background:rgba(5,7,9,.88);color:${MUTED};font-size:12px;line-height:1.6;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
          <div>FOBIbass · Accra, Oyarifa, Ankonam</div>
          <div style="color:${GOLD};font-weight:700;">Need help? Reply to this email.</div>
        </div>
      </div>
    </div>
  </div>`;
}

function button(url, label) {
  return `<a href="${url}" style="display:inline-block;margin-top:18px;padding:13px 24px;background:linear-gradient(135deg, ${GOLD_SOFT}, ${GOLD});color:${BLACK};font-weight:800;text-decoration:none;border-radius:999px;box-shadow:0 12px 22px rgba(212,175,55,.2), inset 0 0 0 1px rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.12);letter-spacing:.2px;">${label} →</a>`;
}

function labelBadge(text) {
  return `<span style="display:inline-block;padding:6px 10px;border-radius:999px;background:rgba(212,175,55,.12);border:1px solid rgba(212,175,55,.35);color:${GOLD};font-size:10px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;box-shadow:inset 0 0 0 1px rgba(255,255,255,.02);">${text}</span>`;
}

function infoRow(label, value) {
  return `
    <tr>
      <td style="padding:8px 0;color:${MUTED};font-size:13px;font-weight:600;border-bottom:1px solid rgba(255,255,255,.06);">${label}</td>
      <td style="padding:8px 0;color:${TEXT};font-size:14px;border-bottom:1px solid rgba(255,255,255,.06);">${value}</td>
    </tr>
  `;
}

function otpEmailTemplate({ name, otp, expiryMinutes }) {
  return wrapper(`
    <div style="margin-bottom:18px;">${labelBadge("Secure access")}</div>
    <h2 style="color:${GOLD};margin:0 0 12px;font-size:28px;line-height:1.2;">Password reset</h2>
    <p style="color:${TEXT};margin:0 0 20px;line-height:1.7;font-size:15px;">
      Hi ${name || "there"}, a password reset was requested for your FOBIbass client portal.
      Use the code below to continue securely.
    </p>
    <div style="font-size:34px;letter-spacing:10px;font-weight:800;color:${WHITE};background:linear-gradient(180deg, rgba(255,255,255,.02), rgba(212,175,55,.05));border:1px solid rgba(212,175,55,.4);border-radius:12px;padding:18px;text-align:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.03);">${otp}</div>
    <p style="color:${MUTED};font-size:13px;margin-top:18px;line-height:1.6;">This code expires in ${expiryMinutes} minutes. If you did not request this reset, you can safely ignore this message.</p>
  `);
}

function bookingConfirmationTemplate({
  name,
  email,
  eventType,
  eventDate,
  location,
  loginUrl,
  tempPassword,
  googleCalendarLink,
  icsDownloadUrl,
}) {
  return wrapper(`
    <div style="margin-bottom:18px;">${labelBadge("Booking received")}</div>
    <h2 style="color:${GOLD};margin:0 0 10px;font-size:30px;line-height:1.2;">Welcome aboard, ${name}</h2>
    <p style="color:${TEXT};margin:0;line-height:1.7;font-size:15px;">
      Thanks for choosing FOBIbass. Your booking request has been received and is now in our queue for review.
    </p>

    <div style="margin-top:22px;padding:18px 18px 6px;border:1px solid rgba(255,255,255,.06);border-radius:12px;background:rgba(255,255,255,.01);">
      <table style="width:100%;color:${WHITE};font-size:14px;border-collapse:separate;border-spacing:0;">
        ${infoRow("Event type", eventType)}
        ${infoRow("Date", eventDate)}
        ${infoRow("Location", location)}
      </table>
    </div>

    <div style="margin-top:24px;padding:18px;border:1px solid rgba(212,175,55,.25);border-radius:12px;background:linear-gradient(180deg, rgba(212,175,55,.06), rgba(255,255,255,.01));">
      <div style="color:${GOLD};font-size:12px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;">Portal access</div>
      <p style="color:${TEXT};margin:0;line-height:1.6;font-size:14px;">Your client portal account is ready. Please use the email below to log in.</p>
      <table style="width:100%;color:${WHITE};font-size:14px;margin-top:12px;border-collapse:separate;border-spacing:0;">
        ${infoRow("Email", email)}
      </table>
      <p style="color:${TEXT};font-size:14px;margin:12px 0 0;line-height:1.6;">Temporary password: <strong style="color:${GOLD};">${tempPassword}</strong></p>
      <p style="color:${MUTED};font-size:12px;line-height:1.6;margin-top:8px;">You will be prompted to update this password after your first login. Please keep it private.</p>
      ${button(loginUrl, "Open client portal")}
    </div>

    <div style="margin-top:24px;">
      <div style="color:${GOLD};font-size:12px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">Calendar</div>
      <p style="color:${MUTED};margin:0;line-height:1.7;font-size:14px;">
        <a href="${googleCalendarLink}" style="color:${GOLD};">Add to Google Calendar</a>
        &nbsp;·&nbsp;
        <a href="${icsDownloadUrl}" style="color:${GOLD};">Download .ics</a>
      </p>
    </div>
  `);
}

function adminNewBookingTemplate({
  name,
  email,
  phone,
  eventType,
  eventDate,
  location,
  budget,
  message,
  managerUrl,
}) {
  return wrapper(`
    <div style="margin-bottom:18px;">${labelBadge("New request")}</div>
    <h2 style="color:${GOLD};margin:0 0 14px;font-size:30px;line-height:1.2;">New booking request</h2>
    <p style="color:${TEXT};margin:0;line-height:1.7;font-size:15px;">A new enquiry has been submitted through the FOBIbass booking form.</p>

    <div style="margin-top:22px;padding:18px 18px 6px;border:1px solid rgba(255,255,255,.06);border-radius:12px;background:rgba(255,255,255,.01);">
      <table style="width:100%;color:${WHITE};font-size:14px;border-collapse:separate;border-spacing:0;">
        ${infoRow("Client name", name)}
        ${infoRow("Email", email)}
        ${infoRow("Phone", phone || "—")}
        ${infoRow("Event type", eventType)}
        ${infoRow("Date", eventDate)}
        ${infoRow("Location", location)}
        ${infoRow("Budget", budget || "—")}
      </table>
    </div>

    ${message ? `
      <div style="margin-top:22px;padding:16px 18px;border-left:3px solid ${GOLD};border-radius:10px;background:rgba(212,175,55,.05);">
        <div style="color:${GOLD};font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">Message</div>
        <p style="color:${TEXT};margin:0;line-height:1.7;font-size:14px;">${message}</p>
      </div>
    ` : ""}

    ${button(managerUrl, "Open manager dashboard")}
  `);
}

function adminAttendanceConfirmTemplate({
  clientName,
  eventType,
  eventDate,
  confirmUrl,
}) {
  return wrapper(`
    <div style="margin-bottom:18px;">${labelBadge("Attendance review")}</div>
    <h2 style="color:${GOLD};margin:0 0 12px;font-size:30px;line-height:1.2;">Attendance confirmation</h2>
    <p style="color:${TEXT};margin:0;line-height:1.7;font-size:15px;">
      The event below has now passed. Please confirm whether <strong style="color:${WHITE};">${clientName}</strong> attended.
    </p>
    <div style="margin-top:22px;padding:18px 18px 6px;border:1px solid rgba(255,255,255,.06);border-radius:12px;background:rgba(255,255,255,.01);">
      <table style="width:100%;color:${WHITE};font-size:14px;border-collapse:separate;border-spacing:0;">
        ${infoRow("Event", eventType)}
        ${infoRow("Date", eventDate)}
      </table>
    </div>
    <p style="color:${MUTED};font-size:13px;margin-top:18px;line-height:1.6;">If confirmed, the client portal access will be closed automatically.</p>
    ${button(confirmUrl, "Yes, confirmed")}
  `);
}

function accessClosedTemplate({ name, eventType }) {
  return wrapper(`
    <div style="margin-bottom:18px;">${labelBadge("Event completed")}</div>
    <h2 style="color:${GOLD};margin:0 0 12px;font-size:30px;line-height:1.2;">Thank you, ${name}</h2>
    <p style="color:${TEXT};margin:0;line-height:1.7;font-size:15px;">
      Your event, <strong style="color:${WHITE};">${eventType}</strong>, has been marked as completed. Your client portal access has now been closed.
    </p>
    <p style="color:${MUTED};margin-top:18px;line-height:1.7;font-size:14px;">It was a pleasure working with you. We hope to play for you again soon.</p>
  `);
}

function adminPasswordResetTemplate({ resetLink }) {
  return wrapper(`
    <div style="margin-bottom:18px;">${labelBadge("Manager access")}</div>
    <h2 style="color:${GOLD};margin:0 0 12px;font-size:30px;line-height:1.2;">Manager password reset</h2>
    <p style="color:${TEXT};margin:0;line-height:1.7;font-size:15px;">A password reset was requested for the FOBIbass manager dashboard. Use the button below to continue.</p>
    ${button(resetLink, "Reset password")}
    <p style="color:${MUTED};font-size:13px;margin-top:18px;line-height:1.6;">This link expires in 1 hour. If you did not request this reset, you can safely ignore this message.</p>
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

