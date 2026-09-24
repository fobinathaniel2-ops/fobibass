const jwt = require("jsonwebtoken");
const { readStore } = require("../config/store");

const SECRET = process.env.SESSION_SECRET || "change-this-session-secret";
const COOKIE = "fobee_session";

function parseCookies(header = "") {
  return Object.fromEntries(header.split(";").map((part) => part.trim().split("=")).filter(([key, value]) => key && value).map(([key, value]) => [key, decodeURIComponent(value)]));
}
function signSession(user) { return jwt.sign({ userId: user.id, role: user.role, email: user.email }, SECRET, { expiresIn: "7d" }); }
function setSession(res, user) { res.setHeader("Set-Cookie", `${COOKIE}=${encodeURIComponent(signSession(user))}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`); }
function clearSession(res) { res.setHeader("Set-Cookie", `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`); }
async function getUser(req) {
  const token = parseCookies(req.headers.cookie || "")[COOKIE];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, SECRET);
    return (await readStore()).users.find((user) => user.id === payload.userId && user.active !== false) || null;
  } catch {
    return null;
  }
}

async function getLatestBookingForUser(user) {
  const store = await readStore();
  const bookings = store.bookings
    .filter((booking) => booking.uid === user.id || booking.email === user.email)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return bookings[0] || null;
}

async function requireAuth(req, res, next) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "Please sign in." });

  req.user = user;
  req.booking = await getLatestBookingForUser(user);
  next();
}

async function requireAdmin(req, res, next) {
  const user = await getUser(req);
  if (!user || user.role !== "admin") return res.status(403).json({ error: "Admin access required." });
  req.user = user;
  next();
}

module.exports = { COOKIE, setSession, clearSession, getUser, requireAuth, requireAdmin };
