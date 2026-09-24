const express = require("express");
const { readStore, update } = require("../config/store");
const verifyAdminAuth = require("../middleware/verifyAdminAuth");
const { signToken, verifyToken } = require("../utils/tokens");

const router = express.Router();
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);

router.get("/bookings", verifyAdminAuth, async (req, res) => {
  const bookings = (await readStore()).bookings.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ bookings });
});

router.post("/bookings/:id/status", verifyAdminAuth, async (req, res) => {
  const status = String(req.body?.status || "").trim();
  const allowedStatuses = ["Pending", "Approved", "Rejected", "Completed", "Attended"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid booking status." });
  }

  const booking = (await readStore()).bookings.find((item) => item.id === req.params.id);
  if (!booking) {
    return res.status(404).json({ error: "Booking not found." });
  }

  await update((store) => {
    const item = store.bookings.find((entry) => entry.id === req.params.id);
    if (!item) return;

    item.status = status;
    item.canLogin = status === "Pending" || status === "Approved";
    item.attendanceConfirmed = status === "Attended" || status === "Completed";

    if (status === "Attended") {
      item.attendanceConfirmedAt = new Date().toISOString();
    }
  });

  res.json({ ok: true, status });
});

router.post("/bookings/:id/request-attendance", verifyAdminAuth, async (req, res) => {
  const booking = (await readStore()).bookings.find((item) => item.id === req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found." });
  await update((store) => { const item = store.bookings.find((entry) => entry.id === req.params.id); item.confirmationRequestSent = true; item.confirmationRequestSentAt = new Date().toISOString(); });
  res.json({ message: "Attendance confirmation marked for this booking." });
});

router.get("/confirm-attendance", async (req, res) => {
  try {
    const payload = verifyToken(req.query.token);
    if (payload.purpose !== "confirm_attendance") throw new Error("Invalid token");
    await update((store) => { const booking = store.bookings.find((item) => item.id === payload.bookingId); if (booking) { booking.status = "attended"; booking.canLogin = false; booking.attendanceConfirmed = true; booking.attendanceConfirmedAt = new Date().toISOString(); } });
    res.send("<html><body style=\"font-family:sans-serif;background:#050505;color:#fff;padding:40px;text-align:center\"><h2 style=\"color:#FFD700\">Attendance confirmed</h2><p>Portal access has been closed for this booking.</p></body></html>");
  } catch { res.status(400).send("Invalid or expired confirmation link."); }
});

router.post("/request-password-reset", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "Email is required." });
  res.json({ message: ADMIN_EMAILS.includes(email) ? "Admin password reset is available through the client portal reset flow." : "If that email is a manager account, a reset link has been sent." });
});

router.post("/biometric-access", verifyAdminAuth, async (req, res) => {
  const enabled = Boolean(req.body?.enabled);

  await update((store) => {
    const user = store.users.find((entry) => entry.id === req.user.id);
    if (user) user.biometricEnabled = enabled;
  });

  res.json({ ok: true, biometricEnabled: enabled });
});

router.get("/content", verifyAdminAuth, async (req, res) => {
  const store = await readStore();
  res.json({
    settings: store.settings || {},
    availability: store.availability || [],
    videos: store.videos || [],
    services: store.services || [],
    testimonials: store.testimonials || [],
  });
});

router.post("/content/hero", verifyAdminAuth, async (req, res) => {
  const { title, subtitle } = req.body || {};
  await update((store) => {
    store.settings = store.settings || {};
    store.settings.hero = {
      title: title || store.settings.hero?.title || "Feel The Groove. Hear The Difference.",
      subtitle: subtitle || store.settings.hero?.subtitle || "Bass Guitarist - Live Performances - Studio Sessions - Worship - Lessons",
    };
  });
  return res.json({ ok: true });
});

router.post("/content/bio", verifyAdminAuth, async (req, res) => {
  const bio = String(req.body?.bio || "").trim();
  await update((store) => {
    store.settings = store.settings || {};
    store.settings.bio = { bio: bio || "Fobee Bass brings rich low-end, musical pocket, and an unmistakable live presence to every room." };
  });
  return res.json({ ok: true });
});

router.post("/content/contact", verifyAdminAuth, async (req, res) => {
  const { phone, email, location } = req.body || {};
  await update((store) => {
    store.settings = store.settings || {};
    store.settings.contact = {
      phone: String(phone || ""),
      email: String(email || ""),
      location: String(location || ""),
    };
  });
  return res.json({ ok: true });
});

router.post("/content/socials", verifyAdminAuth, async (req, res) => {
  const { youtube, instagram, tiktok, x } = req.body || {};
  await update((store) => {
    store.settings = store.settings || {};
    store.settings.socials = {
      youtube: String(youtube || ""),
      instagram: String(instagram || ""),
      tiktok: String(tiktok || ""),
      x: String(x || ""),
    };
  });
  return res.json({ ok: true });
});

router.post("/content/availability", verifyAdminAuth, async (req, res) => {
  const { date, status, event } = req.body || {};
  if (!date) return res.status(400).json({ error: "Date is required." });

  await update((store) => {
    store.availability = store.availability || [];
    const item = { id: Date.now().toString(), date, status: status || "available", event: event || "" };
    store.availability.push(item);
  });

  return res.json({ ok: true });
});

router.post("/content/videos", verifyAdminAuth, async (req, res) => {
  const { title, category, url, cover } = req.body || {};
  if (!title || !url) return res.status(400).json({ error: "Title and URL are required." });

  await update((store) => {
    store.videos = store.videos || [];
    store.videos.push({
      id: Date.now().toString(),
      title,
      category: category || "video",
      url,
      cover: cover || "",
    });
  });

  return res.json({ ok: true });
});

router.post("/content/services", verifyAdminAuth, async (req, res) => {
  const { name, description } = req.body || {};
  if (!name) return res.status(400).json({ error: "Service name is required." });

  await update((store) => {
    store.services = store.services || [];
    store.services.push({
      id: Date.now().toString(),
      name,
      description: description || "",
    });
  });

  return res.json({ ok: true });
});

router.post("/content/testimonials", verifyAdminAuth, async (req, res) => {
  const { name, message, rating } = req.body || {};
  if (!name || !message) return res.status(400).json({ error: "Name and message are required." });

  await update((store) => {
    store.testimonials = store.testimonials || [];
    store.testimonials.push({
      id: Date.now().toString(),
      name,
      message,
      rating: Number(rating || 5),
    });
  });

  return res.json({ ok: true });
});

module.exports = router;
