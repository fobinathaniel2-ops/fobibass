const express = require("express");

const router = express.Router();
const CHANNEL_HANDLE = process.env.YOUTUBE_CHANNEL_HANDLE || "FOBIbass";

router.get("/", async (req, res) => {
  if (!process.env.YOUTUBE_API_KEY) return res.status(503).json({ error: "YouTube API is not configured." });

  try {
    const key = process.env.YOUTUBE_API_KEY;
    const channelParams = new URLSearchParams({ part: "contentDetails", forHandle: CHANNEL_HANDLE, key });
    const channelResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?${channelParams}`);
    const channelData = await channelResponse.json();
    const uploadsPlaylist = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsPlaylist) return res.status(502).json({ error: "Could not find the YouTube uploads playlist." });

    const playlistParams = new URLSearchParams({ part: "snippet,contentDetails", playlistId: uploadsPlaylist, maxResults: "12", key });
    const playlistResponse = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${playlistParams}`);
    const playlistData = await playlistResponse.json();
    if (!playlistResponse.ok) return res.status(502).json({ error: "Could not load YouTube videos." });

    const videos = (playlistData.items || []).map((item) => ({
      id: item.contentDetails.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
      url: `https://www.youtube.com/watch?v=${item.contentDetails.videoId}`,
    }));

    return res.json({ videos });
  } catch (error) {
    console.error("[GET /api/youtube/videos]", error);
    return res.status(500).json({ error: "Could not load YouTube videos." });
  }
});

module.exports = router;
