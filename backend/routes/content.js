const express = require("express");
const { readStore, update, now } = require("../config/store");

const router = express.Router();

router.get("/", async (req, res) => {
  const store = await readStore();

  res.json({
    settings: {
      hero: store.settings?.hero || { title: "Feel The Groove. Hear The Difference.", subtitle: "Bass Guitarist - Live Performances - Studio Sessions - Worship - Lessons" },
      bio: store.settings?.bio || { bio: "Fobee Bass brings rich low-end, musical pocket, and an unmistakable live presence to every room." },
      contact: store.settings?.contact || { phone: "", email: "", location: "" },
      socials: store.settings?.socials || { youtube: "", instagram: "", tiktok: "", x: "" },
    },
    availability: store.availability || [],
    videos: store.videos || [],
    services: store.services || [],
    testimonials: store.testimonials || [],
  });
});

router.post("/testimonials", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const message = String(req.body?.message || "").trim();
  const rating = Number(req.body?.rating || 5);

  if (!name || !message) {
    return res.status(400).json({ error: "Name and message are required." });
  }

  await update((store) => {
    store.testimonials = store.testimonials || [];
    store.testimonials.push({
      id: Date.now().toString(),
      name,
      message,
      rating: Number.isFinite(rating) ? Math.min(Math.max(rating, 1), 5) : 5,
      createdAt: now(),
    });
  });

  return res.status(201).json({ ok: true });
});

module.exports = router;
