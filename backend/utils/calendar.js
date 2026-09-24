// ======================================
// calendar.js
// Builds a standards-compliant .ics file (works with Apple/Outlook/Google
// "import" flows) and a direct "Add to Google Calendar" link, with no
// extra npm dependency.
// ======================================

function toICSDate(date) {
  // Formats a JS Date as UTC "YYYYMMDDTHHMMSSZ" per the iCalendar spec
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function escapeICSText(text = "") {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * @param {Object} opts
 * @param {string} opts.uid - unique id for this event (e.g. bookingId)
 * @param {string} opts.title
 * @param {string} opts.description
 * @param {string} opts.location
 * @param {Date}   opts.start
 * @param {Date}   opts.end
 */
function buildICS({ uid, title, description, location, start, end }) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FOBIbass//Booking System//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}@fobeebass`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${escapeICSText(title)}`,
    `DESCRIPTION:${escapeICSText(description)}`,
    `LOCATION:${escapeICSText(location)}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  // iCalendar spec requires CRLF line endings
  return lines.join("\r\n");
}

/**
 * @param {Object} opts
 * @param {string} opts.title
 * @param {string} opts.description
 * @param {string} opts.location
 * @param {Date}   opts.start
 * @param {Date}   opts.end
 */
function buildGoogleCalendarLink({ title, description, location, start, end }) {
  const format = (d) => toICSDate(d);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${format(start)}/${format(end)}`,
    details: description || "",
    location: location || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

module.exports = { buildICS, buildGoogleCalendarLink };

