const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { readStore, update, now } = require("../config/store");
const { setSession, clearSession, getUser } = require("../middleware/sessionAuth");
const { sendMail } = require("../config/mailer");
const { otpEmailTemplate } = require("../templates/emailTemplates");

const router = express.Router();
const otpExpiry = Number(process.env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000;

router.post("/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const user = (await readStore()).users.find((item) => item.email === email && item.active !== false);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: "Incorrect email or password." });

  await update((store) => {
    const account = store.users.find((item) => item.id === user.id);
    if (account) account.lastLogin = now();
  });

  const refreshedUser = (await readStore()).users.find((item) => item.id === user.id && item.active !== false);
  setSession(res, refreshedUser);
  res.json({ user: { id: refreshedUser.id, email: refreshedUser.email, role: refreshedUser.role, name: refreshedUser.name, biometricEnabled: Boolean(refreshedUser.biometricEnabled), lastLogin: refreshedUser.lastLogin } });
});

router.get("/biometric-status", async (req, res) => {
  const email = String(req.query.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "Email is required." });

  const user = (await readStore()).users.find((item) => item.email === email && item.active !== false);
  res.json({ biometricEnabled: Boolean(user?.biometricEnabled) });
});

router.post("/logout", (req, res) => { clearSession(res); res.json({ ok: true }); });
router.get("/me", async (req, res) => { const user = await getUser(req); res.json({ user: user ? { id: user.id, email: user.email, role: user.role, name: user.name, biometricEnabled: Boolean(user.biometricEnabled), lastLogin: user.lastLogin } : null }); });

router.post("/request-otp", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "Email is required." });
  const user = (await readStore()).users.find((item) => item.email === email);
  if (user) {
    const code = crypto.randomInt(0, 1000000).toString().padStart(6, "0");
    await update((store) => { store.otps = store.otps.filter((item) => item.email !== email); store.otps.push({ email, hash: crypto.createHash("sha256").update(code).digest("hex"), expiresAt: Date.now() + otpExpiry, attempts: 0 }); });
    try {
      await sendMail({
        to: email,
        subject: "Your FOBIbass password reset code",
        html: otpEmailTemplate({
          name: user?.name || "there",
          otp: code,
          expiryMinutes: Math.round(otpExpiry / 60000),
        }),
      });
    } catch (error) { console.warn("OTP email unavailable:", error.message); if (process.env.NODE_ENV !== "production") console.log(`[dev OTP] ${email}: ${code}`); }
  }
  res.json({ message: "If an account exists for this email, a code has been sent." });
});

router.post("/verify-otp", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase(); const otp = String(req.body.otp || ""); const item = (await readStore()).otps.find((entry) => entry.email === email);
  if (!item) return res.status(400).json({ error: "No code was requested for this email." });
  if (item.expiresAt < Date.now()) return res.status(400).json({ error: "This code has expired. Request a new one." });
  if (crypto.createHash("sha256").update(otp).digest("hex") !== item.hash) return res.status(400).json({ error: "Incorrect code." });
  const resetToken = crypto.randomBytes(32).toString("hex");
  await update((store) => { store.otps = store.otps.filter((entry) => entry.email !== email); store.otps.push({ email, resetToken, expiresAt: Date.now() + 15 * 60 * 1000 }); });
  res.json({ resetToken });
});

router.post("/reset-password", async (req, res) => {
  const item = (await readStore()).otps.find((entry) => entry.resetToken === req.body.resetToken);
  if (!item || item.expiresAt < Date.now()) return res.status(401).json({ error: "Reset token expired. Start over." });
  if (String(req.body.newPassword || "").length < 8) return res.status(400).json({ error: "Password must be at least 8 characters." });
  const passwordHash = await bcrypt.hash(req.body.newPassword, 12);
  await update((store) => { const user = store.users.find((entry) => entry.email === item.email); if (user) user.passwordHash = passwordHash; store.otps = store.otps.filter((entry) => entry !== item); });
  res.json({ message: "Password updated. You can now log in." });
});

router.post("/change-password", async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Please sign in." });

  const currentPassword = String(req.body.currentPassword || "");
  const newPassword = String(req.body.newPassword || "");

  if (!currentPassword || !newPassword) return res.status(400).json({ error: "Current and new passwords are required." });
  if (newPassword.length < 8) return res.status(400).json({ error: "New password must be at least 8 characters." });

  const account = (await readStore()).users.find((entry) => entry.id === user.id && entry.active !== false);
  if (!account) return res.status(404).json({ error: "Account not found." });

  const matches = await bcrypt.compare(currentPassword, account.passwordHash);
  if (!matches) return res.status(401).json({ error: "Current password is incorrect." });

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await update((store) => {
    const target = store.users.find((entry) => entry.id === user.id);
    if (target) target.passwordHash = passwordHash;
  });

  res.json({ message: "Password updated successfully." });
});

module.exports = router;

