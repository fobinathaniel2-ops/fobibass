const express = require("express");
const { readStore, update, now, defaults } = require("../config/store");
const { publicAvailability } = require("../utils/availability");

const router = express.Router();

router.get("/", async (req, res) => {
  const store = await readStore();

  res.json({
    settings: {
      hero: store.settings?.hero || defaults.settings.hero,
      bio: store.settings?.bio || defaults.settings.bio,
      contact: store.settings?.contact || defaults.settings.contact,
      socials: store.settings?.socials || defaults.settings.socials,
    },
    availability: publicAvailability(store),
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
