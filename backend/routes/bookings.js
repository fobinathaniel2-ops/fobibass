const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { readStore, update, id, now } = require("../config/store");
const { sendMail } = require("../config/mailer");
const { buildGoogleCalendarLink } = require("../utils/calendar");
const { isValidDate, dateConflict } = require("../utils/availability");
const { adminNewBookingTemplate, bookingConfirmationTemplate } = require("../templates/emailTemplates");

const router = express.Router();
const temporaryPassword = () => crypto.randomBytes(6).toString("hex");
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((email) => email.trim()).filter(Boolean);

router.post("/", async (req, res) => {
  try {
    const { name, email, phone, eventType, eventDate, location, budget, message } = req.body;
    if (!name || !email || !phone || !eventType || !eventDate || !location) return res.status(400).json({ error: "Missing required booking fields." });
    const normalizedEmail = String(email).trim().toLowerCase();
    const store = await readStore();
    if (!isValidDate(eventDate)) return res.status(400).json({ error: "Please choose a valid event date." });
    if (dateConflict(store, eventDate)) return res.status(409).json({ error: "Sorry, that date is already booked. Please choose another date." });
    let user = store.users.find((item) => item.email === normalizedEmail);
    let password = null;
    if (!user) { password = temporaryPassword(); user = { id: id(), email: normalizedEmail, name, role: "client", passwordHash: await bcrypt.hash(password, 12), active: true, createdAt: now() }; }
    const booking = { id: id(), uid: user.id, name, email: normalizedEmail, phone, event: eventType, date: eventDate, location, budget: budget || "", message: message || "", status: "Pending", canLogin: true, attendanceConfirmed: false, confirmationRequestSent: false, createdAt: now() };
    await update((data) => { if (!data.users.some((item) => item.id === user.id)) data.users.push(user); data.bookings.push(booking); });
    const start = new Date(`${eventDate}T18:00:00`); const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    const managerUrl = `${process.env.FRONTEND_URL || "http://localhost:5000"}/manager.html`;
    const clientLoginUrl = `${process.env.FRONTEND_URL || "http://localhost:5000"}/client-login.html`;
    const googleCalendarLink = buildGoogleCalendarLink({ title: `${eventType} - FOBIbass`, description: message || "", location, start, end });
    const icsDownloadUrl = `${process.env.FRONTEND_URL || "http://localhost:5000"}/api/calendar/${booking.id}.ics`;

    try {
      await sendMail({
        to: normalizedEmail,
        subject: "Your FOBIbass booking is confirmed",
        html: bookingConfirmationTemplate({
          name,
          email: normalizedEmail,
          eventType,
          eventDate,
          location,
          loginUrl: clientLoginUrl,
          tempPassword: password || "Your existing password",
          googleCalendarLink,
          icsDownloadUrl,
        }),
      });
    } catch (error) { console.warn("Booking email failed:", error.message); }

    for (const adminEmail of ADMIN_EMAILS) {
      try {
        await sendMail({
          to: adminEmail,
          subject: "New FOBIbass booking request",
          html: adminNewBookingTemplate({
            name,
            email: normalizedEmail,
            phone,
            eventType,
            eventDate,
            location,
            budget,
            message,
            managerUrl,
          }),
        });
      } catch (error) {
        console.warn(`Admin booking email failed for ${adminEmail}:`, error.message);
      }
    }

    return res.status(201).json({ id: booking.id });
  } catch (error) { console.error("[POST /api/bookings]", error); return res.status(500).json({ error: "Could not create booking." }); }
});

module.exports = router;

