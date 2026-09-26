async function loadDashboard() {
  const loading = document.getElementById("loadingText"); const error = document.getElementById("dashboardError");
  try { const response = await fetch("/api/client/stats", { cache: "no-store" }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not load your booking."); loading.style.display = "none"; document.getElementById("bookingCard").style.display = "block"; document.getElementById("cardEvent").textContent = data.event; document.getElementById("cardDate").textContent = data.date; document.getElementById("cardLocation").textContent = data.location; document.getElementById("cardStatus").textContent = data.status; document.getElementById("googleCalLink").href = data.googleCalendarLink; document.getElementById("icsLink").href = data.icsDownloadUrl; } catch (err) { loading.style.display = "none"; error.textContent = err.message; }
}
loadDashboard();
document.getElementById("logoutLink")?.addEventListener("click", async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "client-login.html"; });
