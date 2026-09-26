// ======================================
// server.js
// Entry point. Run with: npm start
// ======================================

require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const path = require("path");

const bookingsRouter = require("./routes/bookings");
const authRouter = require("./routes/auth");
const clientRouter = require("./routes/client");
const adminRouter = require("./routes/admin");
const calendarRouter = require("./routes/calendar");
const mediaRouter = require("./routes/media");
const contentRouter = require("./routes/content");
const youtubeRouter = require("./routes/youtube");
const youtubeVideosRouter = require("./routes/youtubeVideos");

const app = express();

const allowedOrigins = (process.env.FRONTEND_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow no-origin requests (e.g. Postman, server-to-server) and any
      // explicitly allow-listed frontend origin.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
  })
);
app.use(express.json());
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

app.use(express.static(path.join(__dirname, "..")));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/bookings", bookingsRouter);
app.use("/api/auth", authRouter);
app.use("/api/client", clientRouter);
app.use("/api/admin", adminRouter);
app.use("/api/calendar", calendarRouter);
app.use("/api/media", mediaRouter);
app.use("/api/content", contentRouter);
app.use("/api/youtube", youtubeRouter);
app.use("/api/youtube/videos", youtubeVideosRouter);

// 404 fallback
app.use((req, res) => res.status(404).json({ error: "Not found." }));

// Central error handler
app.use((err, req, res, next) => {
  console.error("[unhandled]", err);
  if (err.code === "PERSISTENT_STORE_REQUIRED") {
    return res.status(err.status).json({ error: err.message });
  }
  res.status(500).json({ error: "Internal server error." });
});

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`FOBIbass backend listening on port ${PORT}`);
  });
}

module.exports = app;

