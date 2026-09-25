// ======================================
// availability.js
// One place that decides which dates are open, requested or booked.
//   - Approved bookings block their date automatically.
//   - Pending bookings show as "requested" (the date can still be requested).
//   - The manager can also block a date by hand (store.availability).
// ======================================

const RANK = { available: 0, pending: 1, booked: 2 };

const isValidDate = (value) => {
  const text = String(value || "");
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && !Number.isNaN(new Date(`${text}T00:00:00Z`).getTime());
};
const todayISO = () => new Date().toISOString().slice(0, 10);
const dayOf = (value) => String(value || "").slice(0, 10);

// Public view: one entry per upcoming date, no client details.
function publicAvailability(store) {
  const today = todayISO();
  const byDate = new Map();
  const put = (entry) => {
    const current = byDate.get(entry.date);
    if (!current || RANK[entry.status] > RANK[current.status]) byDate.set(entry.date, entry);
  };

  for (const item of store.availability || []) {
    const date = dayOf(item.date);
    if (!isValidDate(date) || date < today) continue;
    put({ date, status: item.status === "booked" ? "booked" : "available", event: String(item.event || "") });
  }

  for (const booking of store.bookings || []) {
    const date = dayOf(booking.date);
    if (!isValidDate(date) || date < today) continue;
    if (booking.status === "Approved") put({ date, status: "booked", event: "" });
    else if ((booking.status || "Pending") === "Pending") put({ date, status: "pending", event: "" });
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

// Manager view: every upcoming source separately, with client details.
function adminOverview(store) {
  const today = todayISO();
  const rows = [];

  for (const item of store.availability || []) {
    const date = dayOf(item.date);
    if (!isValidDate(date) || date < today) continue;
    rows.push({ source: "manual", id: item.id, date, status: item.status === "booked" ? "booked" : "available", note: String(item.event || "") });
  }

  for (const booking of store.bookings || []) {
    const date = dayOf(booking.date);
    if (!isValidDate(date) || date < today) continue;
    if (booking.status === "Approved" || (booking.status || "Pending") === "Pending") {
      rows.push({
        source: "booking",
        bookingId: booking.id,
        date,
        status: booking.status === "Approved" ? "booked" : "pending",
        client: booking.name || "",
        eventType: booking.event || "",
      });
    }
  }

  return rows.sort((a, b) => a.date.localeCompare(b.date) || RANK[b.status] - RANK[a.status]);
}

// Returns "booking" (another approved booking), "blocked" (manager blocked it) or null.
function dateConflict(store, date, ignoreBookingId) {
  const day = dayOf(date);
  if ((store.bookings || []).some((b) => b.status === "Approved" && b.id !== ignoreBookingId && dayOf(b.date) === day)) return "booking";
  if ((store.availability || []).some((item) => item.status === "booked" && dayOf(item.date) === day)) return "blocked";
  return null;
}

module.exports = { isValidDate, todayISO, publicAvailability, adminOverview, dateConflict };
