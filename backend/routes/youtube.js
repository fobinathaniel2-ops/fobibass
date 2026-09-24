const express = require("express");

const router = express.Router();
const CHANNEL_HANDLE = process.env.YOUTUBE_CHANNEL_HANDLE || "FOBIbass";

router.get("/stats", async (req, res) => {
  if (!process.env.YOUTUBE_API_KEY) {
    return res.status(503).json({ error: "YouTube API is not configured." });
  }

  try {
    const params = new URLSearchParams({
      part: "snippet,statistics",
      forHandle: CHANNEL_HANDLE,
      key: process.env.YOUTUBE_API_KEY,
    });
    const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?${params}`);
    const data = await response.json();
    if (!response.ok || !data.items?.length) return res.status(502).json({ error: "Could not load YouTube channel stats." });

    const channel = data.items[0];
    return res.json({
      handle: `@${CHANNEL_HANDLE}`,
      joined: channel.snippet.publishedAt,
      subscribers: Number(channel.statistics.subscriberCount || 0),
      videos: Number(channel.statistics.videoCount || 0),
      views: Number(channel.statistics.viewCount || 0),
      url: `https://www.youtube.com/@${CHANNEL_HANDLE}`,
    });
  } catch (error) {
    console.error("[GET /api/youtube/stats]", error);
    return res.status(500).json({ error: "Could not load YouTube channel stats." });
  }
});

module.exports = router;
