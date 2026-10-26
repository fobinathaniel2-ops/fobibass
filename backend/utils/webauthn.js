const crypto = require("crypto");
const challenges = new Map();

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

function setChallenge(key, challenge) {
  const expectedChallenge = Buffer.isBuffer(challenge) ? challenge.toString("base64url") : String(challenge);
  challenges.set(key, { challenge: expectedChallenge, expiresAt: Date.now() + CHALLENGE_TTL_MS });
}

function takeChallenge(key) {
  const entry = challenges.get(key);
  challenges.delete(key);
  if (!entry || entry.expiresAt < Date.now()) throw new Error("The biometric challenge expired. Please try again.");
  return entry.challenge;
}

function newChallenge() {
  return crypto.randomBytes(32);
}

function getFirstForwardedValue(req, headerName) {
  const value = req.get(headerName);
  return value ? value.split(",")[0].trim() : "";
}

function getPublicHost(req) {
  return getFirstForwardedValue(req, "x-forwarded-host") || req.get("host") || req.hostname;
}

function getWebAuthnOrigin(req) {
  const protocol = getFirstForwardedValue(req, "x-forwarded-proto") || req.protocol;
  return `${protocol}://${getPublicHost(req).replace(/:\d+$/, "")}`;
}

function getRpID(req) {
  return getPublicHost(req).split(":")[0].replace(/^www\./, "");
}

module.exports = { setChallenge, takeChallenge, newChallenge, getWebAuthnOrigin, getRpID };
