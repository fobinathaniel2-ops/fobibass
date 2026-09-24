const express = require("express");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const verifyAdminAuth = require("../middleware/verifyAdminAuth");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

function uploadBuffer(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    stream.end(buffer);
  });
}

router.post("/upload", verifyAdminAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Choose a file to upload." });

    if (!cloudinary.isConfigured) {
      return res.status(503).json({
        error: "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to backend/.env.",
      });
    }

    const resourceType = req.file.mimetype.startsWith("video/")
      ? "video"
      : req.file.mimetype.startsWith("image/")
        ? "image"
        : "raw";

    const result = await uploadBuffer(req.file.buffer, {
      folder: process.env.CLOUDINARY_FOLDER || "fobee-bass",
      resource_type: resourceType,
      tags: ["fobee-bass", req.body.category || "media"],
    });

    return res.status(201).json({
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
      bytes: result.bytes,
    });
  } catch (error) {
    console.error("[POST /api/media/upload]", error);
    return res.status(500).json({ error: "Upload failed. Check the media configuration and try again." });
  }
});

module.exports = router;
