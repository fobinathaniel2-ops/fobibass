// ======================================
// tokens.js
// Signed, expiring tokens used for:
//  - short-lived password reset tokens (issued after OTP verification)
//  - long-lived "confirm attendance" links sent to the admin's email
// ======================================

const jwt = require("jsonwebtoken");

function signToken(payload, expiresIn) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { signToken, verifyToken };
