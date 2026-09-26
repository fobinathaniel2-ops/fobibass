function cloudinaryAssetFromUrl(value, configuredCloudName) {
  try {
    const parsed = new URL(value);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const uploadIndex = segments.indexOf("upload");
    if (parsed.hostname !== "res.cloudinary.com" || uploadIndex < 2) return null;

    const [cloudName, resourceType] = segments;
    if (cloudName !== configuredCloudName || !["image", "video", "raw"].includes(resourceType)) return null;

    const deliverySegments = segments.slice(uploadIndex + 1);
    const versionIndex = deliverySegments.findIndex((segment) => /^v\d+$/.test(segment));
    if (versionIndex < 0) return null;

    const publicIdSegments = deliverySegments.slice(versionIndex + 1);
    if (!publicIdSegments.length) return null;
    if (resourceType !== "raw") {
      publicIdSegments[publicIdSegments.length - 1] = publicIdSegments.at(-1).replace(/\.[^.]+$/, "");
    }

    return { publicId: publicIdSegments.join("/"), resourceType };
  } catch {
    return null;
  }
}

module.exports = cloudinaryAssetFromUrl;
