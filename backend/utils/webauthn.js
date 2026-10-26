const crypto = require("crypto");
const challenges = new Map();

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

function setChallenge(key, challenge) {
  challenges.set(key, { challenge, expiresAt: Date.now() + CHALLENGE_TTL_MS });
}

function takeChallenge(key) {
  const entry = challenges.get(key);
  challenges.delete(key);
  if (!entry || entry.expiresAt < Date.now()) throw new Error("The biometric challenge expired. Please try again.");
  return entry.challenge;
}

function newChallenge() {
  return crypto.randomBytes(32).toString("base64url");
}

function getWebAuthnOrigin(req) {
  const forwardedProto = req.get("x-forwarded-proto");
  const protocol = forwardedProto ? forwardedProto.split(",")[0].trim() : req.protocol;
  return `${protocol}://${req.get("host")}`;
}

function getRpID(req) {
  return req.hostname;
}

module.exports = { setChallenge, takeChallenge, newChallenge, getWebAuthnOrigin, getRpID };
