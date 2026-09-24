const express = require("express");
const { readStore } = require("../config/store");
const { buildICS } = require("../utils/calendar");
const router = express.Router();

router.get("/:bookingId.ics", async (req, res) => {
  const booking = (await readStore()).bookings.find((item) => item.id === req.params.bookingId);
  if (!booking) return res.status(404).send("Booking not found.");
  const start = new Date(`${booking.date}T18:00:00`); const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="fobee-bass-${booking.id}.ics"`);
  res.send(buildICS({ uid: booking.id, title: `${booking.event} - FOBIbass`, description: booking.message || `Booking for ${booking.name}`, location: booking.location, start, end }));
});

module.exports = router;

