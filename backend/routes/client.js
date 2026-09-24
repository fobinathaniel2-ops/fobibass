// ======================================
// routes/client.js
// GET /api/client/stats — protected, returns the caller's own booking info.
// ======================================

const express = require("express");
const verifyClientAuth = require("../middleware/verifyClientAuth");
const { buildGoogleCalendarLink } = require("../utils/calendar");

const router = express.Router();

const DEFAULT_EVENT_HOURS = 3;

router.get("/stats", verifyClientAuth, async (req, res) => {
  const booking = req.booking;

  if (!booking) {
    return res.status(404).json({ error: "No booking found for this account." });
  }

  const start = new Date(`${booking.date}T18:00:00`);
  const end = new Date(start.getTime() + DEFAULT_EVENT_HOURS * 60 * 60 * 1000);

  return res.json({
    id: booking.id,
    name: booking.name,
    event: booking.event,
    date: booking.date,
    location: booking.location,
    status: booking.status,
    attendanceConfirmed: booking.attendanceConfirmed,
    icsDownloadUrl: `${process.env.APP_URL}/api/calendar/${booking.id}.ics`,
    googleCalendarLink: buildGoogleCalendarLink({
      title: `${booking.event} — FOBIbass`,
      description: booking.message || "",
      location: booking.location,
      start,
      end,
    }),
  });
});

module.exports = router;

