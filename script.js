import { API_BASE } from "./config.js";

const byId = (id) => document.getElementById(id);
const escapeHtml = (value = "") => String(value).replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" }[character]));

const showPageMessageModal = ({ title = "Notice", message = "Something happened.", buttonText = "OK" } = {}) => {
  let modal = document.getElementById("pageMessageModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "pageMessageModal";
    modal.className = "page-message-modal";
    modal.hidden = true;
    modal.innerHTML = `
      <div class="page-message-modal-backdrop" data-close-page-message="true"></div>
      <div class="page-message-modal-card" role="dialog" aria-modal="true" aria-labelledby="pageMessageTitle">
        <div class="page-message-modal-header">
          <h3 id="pageMessageTitle">Notice</h3>
          <button type="button" class="page-message-modal-close" data-close-page-message="true" aria-label="Close message"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
        </div>
        <p class="page-message-modal-message"></p>
        <div class="page-message-modal-actions">
          <button type="button" class="page-message-modal-button" data-close-page-message="true">OK</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener("click", (event) => {
      if (event.target.closest("[data-close-page-message]")) {
        modal.hidden = true;
        document.body.classList.remove("page-modal-open");
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) {
        modal.hidden = true;
        document.body.classList.remove("page-modal-open");
      }
    });
  }

  modal.querySelector("#pageMessageTitle").textContent = title;
  modal.querySelector(".page-message-modal-message").textContent = message;
  modal.querySelector(".page-message-modal-button").textContent = buttonText;
  modal.hidden = false;
  document.body.classList.add("page-modal-open");
};

const navigation = document.querySelector("nav");
const menuToggle = document.querySelector(".menu-toggle");
if (menuToggle && navigation) {
  menuToggle.addEventListener("click", () => { const open = navigation.classList.toggle("nav-open"); menuToggle.setAttribute("aria-expanded", String(open)); menuToggle.innerHTML = `<i class="fa-solid fa-${open ? "xmark" : "bars"}"></i>`; });
  navigation.querySelectorAll("ul a").forEach((link) => link.addEventListener("click", () => { navigation.classList.remove("nav-open"); menuToggle.setAttribute("aria-expanded", "false"); menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>'; }));
}

const bookingForm = byId("bookingForm");
if (bookingForm) bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault(); const button = bookingForm.querySelector("button[type=submit]"); const original = button.innerHTML; button.disabled = true; button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
  try { const response = await fetch(`${API_BASE}/api/bookings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(bookingForm))) }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "Booking failed."); showPageMessageModal({ title: "Booking sent", message: "Booking sent successfully. Check your email for confirmation.", buttonText: "Great" }); bookingForm.reset(); } catch (error) { showPageMessageModal({ title: "Booking failed", message: error.message || "Booking failed.", buttonText: "Try again" }); } finally { button.disabled = false; button.innerHTML = original; }
});

const videoModal = byId("videoModal"); const previewVideo = byId("previewVideo"); const previewYoutube = byId("previewYoutube");
const previewControls = byId("previewControls"); const previewPlay = byId("previewPlay"); const previewProgress = byId("previewProgress"); const previewTime = byId("previewTime");
const videoContainer = byId("videoContainer");
let videoIndex = 0;

function updateVideoSlider() {
  if (!videoContainer) return;
  const cards = [...videoContainer.querySelectorAll(".video-card")];
  const visible = window.innerWidth <= 700 ? 1 : 3;
  const maxIndex = Math.max(0, cards.length - visible);
  videoIndex = Math.min(videoIndex, maxIndex);
  const width = cards[0] ? cards[0].getBoundingClientRect().width + (window.innerWidth <= 700 ? 8 : 15) : 0;
  videoContainer.style.transform = `translateX(-${videoIndex * width}px)`;
  const progress = byId("videoSliderProgress");
  const count = byId("videoSliderCount");
  if (progress) progress.style.width = `${cards.length ? ((videoIndex + visible) / cards.length) * 100 : 100}%`;
  if (count) count.textContent = `${String(Math.min(videoIndex + 1, cards.length)).padStart(2, "0")} / ${String(cards.length).padStart(2, "0")}`;
}
function moveVideoSlider(direction) {
  const count = videoContainer?.querySelectorAll(".video-card").length || 0;
  const visible = window.innerWidth <= 700 ? 1 : 3;
  const maxIndex = Math.max(0, count - visible);
  videoIndex += direction;
  if (videoIndex > maxIndex) videoIndex = 0;
  if (videoIndex < 0) videoIndex = maxIndex;
  updateVideoSlider();
}
document.querySelector(".video-slider-prev")?.addEventListener("click", () => moveVideoSlider(-1));
document.querySelector(".video-slider-next")?.addEventListener("click", () => moveVideoSlider(1));
window.addEventListener("resize", updateVideoSlider);
window.setInterval(() => moveVideoSlider(1), 6000);
function closeVideoPreview() { if (!videoModal) return; previewVideo.pause(); previewVideo.removeAttribute("src"); previewVideo.load(); previewYoutube.hidden = true; previewYoutube.removeAttribute("src"); previewVideo.hidden = false; previewControls.hidden = false; videoModal.hidden = true; document.body.classList.remove("video-modal-open"); }
function openVideoPreview(card) { const source = card.dataset.videoUrl; const youtubeId = card.dataset.youtubeId; if (!videoModal || (!source && !youtubeId)) return; byId("videoModalTitle").textContent = card.querySelector("h3")?.textContent || "FOBIbass Performance"; videoModal.hidden = false; document.body.classList.add("video-modal-open"); if (youtubeId) { previewVideo.hidden = true; previewControls.hidden = true; previewYoutube.hidden = false; previewYoutube.src = `https://www.youtube.com/embed/${encodeURIComponent(youtubeId)}?autoplay=1&rel=0&controls=1`; } else { previewYoutube.hidden = true; previewControls.hidden = false; previewVideo.hidden = false; previewVideo.src = source; previewVideo.play().catch(() => {}); } }
previewPlay?.addEventListener("click", () => { if (previewVideo.paused) previewVideo.play(); else previewVideo.pause(); });
previewVideo?.addEventListener("play", () => { if (previewPlay) previewPlay.innerHTML = '<i class="fa-solid fa-pause"></i>'; });
previewVideo?.addEventListener("pause", () => { if (previewPlay) previewPlay.innerHTML = '<i class="fa-solid fa-play"></i>'; });
previewVideo?.addEventListener("timeupdate", () => { if (!previewVideo.duration) return; previewProgress.value = String((previewVideo.currentTime / previewVideo.duration) * 100); const seconds = Math.floor(previewVideo.currentTime); if (previewTime) previewTime.textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; });
previewProgress?.addEventListener("input", () => { if (previewVideo.duration) previewVideo.currentTime = (Number(previewProgress.value) / 100) * previewVideo.duration; });
document.addEventListener("click", (event) => { const play = event.target.closest(".video-play"); if (play) openVideoPreview(play.closest(".video-card")); if (event.target.closest("[data-close-video]")) closeVideoPreview(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape") { closeVideoPreview(); closeTestimonialForm(); } });

const testimonialModal = byId("testimonialModal"); const testimonialForm = byId("testimonialForm"); const ratingStars = document.querySelectorAll(".rating-star");
function closeTestimonialForm() { if (testimonialModal) { testimonialModal.hidden = true; document.body.classList.remove("video-modal-open"); } }
function openTestimonialForm() { if (testimonialModal) { testimonialModal.hidden = false; document.body.classList.add("video-modal-open"); byId("testimonialName")?.focus(); } }
function setRating(value) { ratingStars.forEach((star) => { star.classList.toggle("is-selected", Number(star.dataset.rating) <= Number(value)); star.setAttribute("aria-checked", String(Number(star.dataset.rating) === Number(value))); }); byId("testimonialRatingValue").value = value; byId("ratingCaption").textContent = `${value} / 5`; }
ratingStars.forEach((star) => star.addEventListener("click", () => setRating(star.dataset.rating)));
document.addEventListener("click", (event) => { if (event.target.closest("[data-open-testimonial]")) openTestimonialForm(); if (event.target.closest("[data-close-testimonial]")) closeTestimonialForm(); });
if (testimonialForm) testimonialForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(testimonialForm);
  const payload = {
    name: String(formData.get("testimonialName") || "").trim(),
    message: String(formData.get("testimonialMessage") || "").trim(),
    rating: Number(formData.get("testimonialRatingValue") || 5),
  };

  const status = byId("testimonialFormStatus");
  if (!payload.name || !payload.message) {
    if (status) status.textContent = "Please complete your name and experience before submitting.";
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/content/testimonials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Unable to save your testimonial.");
    if (status) status.textContent = "Thank you. Your experience has been received.";
    testimonialForm.reset();
    setRating(5);
    await hydrateSiteContent();
  } catch (error) {
    if (status) status.textContent = error.message || "Unable to save your testimonial.";
  }
});

async function refreshYoutubeStats() { try { const response = await fetch(`${API_BASE}/api/youtube/stats`, { cache: "no-store" }); if (!response.ok) return; const stats = await response.json(); byId("youtubeHandle").textContent = stats.handle; byId("youtubeHandle").href = stats.url; byId("youtubeSubscribers").textContent = new Intl.NumberFormat("en-US").format(stats.subscribers); byId("youtubeVideos").textContent = new Intl.NumberFormat("en-US").format(stats.videos); byId("youtubeViews").textContent = new Intl.NumberFormat("en-US").format(stats.views); } catch (error) { console.warn("YouTube stats unavailable", error.message); } }
function renderUploadedVideos(items) {
  const container = byId("videoContainer");
  if (!container) return;

  container.querySelectorAll("[data-uploaded-video]").forEach((card) => card.remove());
  const cards = (Array.isArray(items) ? items : [])
    .filter((video) => video && video.title && video.url)
    .map((video) => `
      <article class="video-card video-card-uploaded" data-local-video="true" data-uploaded-video="true" data-video-url="${escapeHtml(video.url)}">
        <div class="video-poster">
          ${video.cover ? `<img class="video-cover" src="${escapeHtml(video.cover)}" alt="" loading="lazy">` : ""}
          <button class="video-play" type="button" aria-label="Play ${escapeHtml(video.title)}"><i class="fa-solid fa-play"></i></button>
          <span class="video-label">${escapeHtml(video.category || "Video")}</span>
        </div>
        <h3>${escapeHtml(video.title)}</h3>
        <p>${escapeHtml(video.category || "Video")}</p>
      </article>
    `).join("");

  if (cards) container.insertAdjacentHTML("afterbegin", cards);
  updateVideoSlider();
}

async function loadYoutubeVideos() { const container = byId("videoContainer"); if (!container) return; try { const response = await fetch(`${API_BASE}/api/youtube/videos`, { cache: "no-store" }); if (!response.ok) { updateVideoSlider(); return; } const data = await response.json(); const cards = (data.videos || []).map((video) => `<article class="video-card video-card-youtube" data-youtube-id="${escapeHtml(video.id)}"><div class="video-poster" style="background-image:url('${escapeHtml(video.thumbnail || "")}')"><button class="video-play" type="button" aria-label="Play video"><i class="fa-solid fa-play"></i></button><span class="video-label">YouTube</span></div><h3>${escapeHtml(video.title)}</h3><p>Latest upload on @FOBIbass</p></article>`).join(""); if (cards) { container.querySelectorAll("[data-local-video]:not([data-uploaded-video])").forEach((card) => card.remove()); container.insertAdjacentHTML("beforeend", cards); } updateVideoSlider(); } catch (error) { console.warn("YouTube videos unavailable; showing local videos.", error.message); updateVideoSlider(); } }
async function hydrateSiteContent() {
  try {
    const response = await fetch(`${API_BASE}/api/content`, { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    renderUploadedVideos(data.videos);
    const settings = data.settings || {};
    const hero = settings.hero || {};
    const bio = settings.bio || {};
    const contact = settings.contact || {};
    const socials = settings.socials || {};

    const heroTitle = byId("heroTitle");
    const normalizeCopy = (value) => String(value || "").replace(/\s+/g, " ").trim();
    if (heroTitle && hero.title && normalizeCopy(heroTitle.innerText) !== normalizeCopy(hero.title)) {
      heroTitle.textContent = hero.title;
    }
    if (byId("heroSubtitle")) byId("heroSubtitle").textContent = hero.subtitle || byId("heroSubtitle").textContent;
    if (byId("bioText")) byId("bioText").textContent = bio.bio || byId("bioText").textContent;
    const setContactText = (id, iconClass, value) => {
      const element = byId(id);
      if (!element) return;
      const icon = element.querySelector("i") || document.createElement("i");
      const text = String(value || element.textContent || "").trim();
      icon.className = iconClass;
      icon.setAttribute("aria-hidden", "true");
      element.replaceChildren(icon, document.createTextNode(` ${text}`));
    };
    setContactText("contactPhone", "fa-solid fa-phone", contact.phone);
    setContactText("contactEmail", "fa-regular fa-envelope", contact.email);
    setContactText("contactLocation", "fa-solid fa-location-dot", contact.location);
    const contactEmailLink = document.querySelector('.contact-actions a[href^="mailto:"]');
    if (contactEmailLink && contact.email) contactEmailLink.href = `mailto:${contact.email}`;

    const socialLinkTargets = {
      youtube: document.querySelector('.social-links a[aria-label="YouTube"]'),
      instagram: document.querySelector('.social-links a[aria-label="Instagram"]'),
      tiktok: document.querySelector('.social-links a[aria-label="TikTok"]'),
      x: document.querySelector('.social-links a[aria-label="X"]'),
    };

    if (socialLinkTargets.youtube) socialLinkTargets.youtube.href = socials.youtube || 'https://www.youtube.com/@FOBIbass';
    if (socialLinkTargets.instagram) socialLinkTargets.instagram.href = socials.instagram || '#contact';
    if (socialLinkTargets.tiktok) socialLinkTargets.tiktok.href = socials.tiktok || 'https://www.tiktok.com/@fobi_bass?_r=1&_t=ZS-99gMTwWcj2G';
    if (socialLinkTargets.x) socialLinkTargets.x.href = socials.x || '#contact';

    const serviceContainer = byId("serviceContainer");
    if (serviceContainer && Array.isArray(data.services) && data.services.length) {
      serviceContainer.innerHTML = data.services.map((service) => `
        <article class="service-card">
          <h3>${escapeHtml(service.name)}</h3>
          <p>${escapeHtml(service.description || "")}</p>
        </article>
      `).join("");
    }

    const testimonialContainer = byId("testimonialContainer");
    if (testimonialContainer && Array.isArray(data.testimonials) && data.testimonials.length) {
      const defaultFallback = testimonialContainer.querySelector("[data-fallback]");
      if (defaultFallback) defaultFallback.remove();
      testimonialContainer.innerHTML = data.testimonials.map((testimonial) => {
        const name = String(testimonial.name || "").trim() || "Anonymous";
        const initial = name.charAt(0).toUpperCase();
        const rating = Math.min(5, Math.max(1, Number(testimonial.rating) || 5));
        const starsHtml = Array.from({ length: 5 }, (_, i) => `<i class="fa-solid fa-star${i < rating ? "" : " is-empty"}" aria-hidden="true"></i>`).join("");
        return `
        <article class="testimonial-card">
          <i class="fa-solid fa-quote-left testimonial-quote-mark" aria-hidden="true"></i>
          <p class="testimonial-message">${escapeHtml(testimonial.message)}</p>
          <div class="testimonial-meta">
            <span class="testimonial-avatar" aria-hidden="true">${escapeHtml(initial)}</span>
            <div class="testimonial-who">
              <strong>${escapeHtml(name)}</strong>
              <span class="testimonial-stars" role="img" aria-label="${rating} out of 5 stars">${starsHtml}</span>
            </div>
          </div>
        </article>
      `;
      }).join("");
    }

    renderAvailability(data.availability);
  } catch (error) {
    console.warn("Site content unavailable", error.message);
  }
}

// ---------- Availability calendar ----------
const availabilityByDate = new Map();
const calendarCursor = new Date();
calendarCursor.setDate(1);

const pad2 = (value) => String(value).padStart(2, "0");
const toISODate = (year, month, day) => `${year}-${pad2(month + 1)}-${pad2(day)}`;
const todayISODate = () => { const now = new Date(); return toISODate(now.getFullYear(), now.getMonth(), now.getDate()); };
const eventDateInput = byId("eventDate");

function syncEventDateValidity() {
  if (!eventDateInput) return;
  const entry = availabilityByDate.get(eventDateInput.value);
  eventDateInput.setCustomValidity(entry && entry.status === "booked" ? "That date is already booked. Please choose another date." : "");
}

function drawCalendar(message = "") {
  const calendar = byId("calendar");
  if (!calendar) return;

  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  const monthLabel = calendarCursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const leading = (new Date(year, month, 1).getDay() + 6) % 7; // weeks start on Monday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = todayISODate();
  const now = new Date();
  const atStart = year === now.getFullYear() && month === now.getMonth();
  const last = new Date(now.getFullYear(), now.getMonth() + 12, 1);
  const atEnd = year === last.getFullYear() && month === last.getMonth();
  const stateLabels = { available: "Available", pending: "Requested", booked: "Booked", past: "" };

  let cells = "";
  for (let i = 0; i < leading; i += 1) cells += '<span class="cal-cell is-empty" aria-hidden="true"></span>';
  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = toISODate(year, month, day);
    const entry = availabilityByDate.get(iso);
    let state = "available";
    if (iso < today) state = "past";
    else if (entry && entry.status === "booked") state = "booked";
    else if (entry && entry.status === "pending") state = "pending";
    const note = entry && entry.event ? `, ${entry.event}` : "";
    cells += `<button type="button" class="cal-cell is-${state}${iso === today ? " is-today" : ""}${eventDateInput && eventDateInput.value === iso ? " is-selected" : ""}" data-date="${iso}" data-note="${escapeHtml(entry && entry.event ? entry.event : "")}"${state === "past" ? " disabled" : ""} aria-label="${escapeHtml(`${day} ${monthLabel}${stateLabels[state] ? ": " + stateLabels[state] + note : ""}`)}">${day}</button>`;
  }

  calendar.innerHTML = `
    <div class="cal">
      <div class="cal-head">
        <button type="button" class="cal-nav" data-cal-nav="-1" aria-label="Previous month"${atStart ? " disabled" : ""}><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>
        <strong>${escapeHtml(monthLabel)}</strong>
        <button type="button" class="cal-nav" data-cal-nav="1" aria-label="Next month"${atEnd ? " disabled" : ""}><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>
      </div>
      <div class="cal-weekdays" aria-hidden="true"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
      <div class="cal-grid">${cells}</div>
      <div class="cal-legend">
        <span><i class="is-available"></i>Available</span>
        <span><i class="is-pending"></i>Requested</span>
        <span><i class="is-booked"></i>Booked</span>
      </div>
      <p class="cal-message" role="status">${escapeHtml(message || "Tap an open date to start your booking request.")}</p>
    </div>
  `;
}

function renderAvailability(items) {
  const calendar = byId("calendar");
  if (!calendar) return;
  availabilityByDate.clear();
  (Array.isArray(items) ? items : []).forEach((item) => {
    if (item && item.date) availabilityByDate.set(String(item.date).slice(0, 10), item);
  });
  calendar.classList.add("availability-calendar");
  drawCalendar();
  syncEventDateValidity();
}

const calendarRoot = byId("calendar");
if (calendarRoot) {
  calendarRoot.addEventListener("click", (event) => {
    const nav = event.target.closest("[data-cal-nav]");
    if (nav) {
      calendarCursor.setMonth(calendarCursor.getMonth() + Number(nav.dataset.calNav));
      drawCalendar();
      return;
    }

    const cell = event.target.closest(".cal-cell[data-date]");
    if (!cell || cell.disabled) return;
    const iso = cell.dataset.date;
    const pretty = new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

    if (cell.classList.contains("is-booked")) {
      const note = cell.dataset.note ? ` (${cell.dataset.note})` : "";
      drawCalendar(`${pretty} is already booked${note}. Please pick another date.`);
      return;
    }

    if (eventDateInput) {
      eventDateInput.value = iso;
      syncEventDateValidity();
    }
    drawCalendar(`${pretty} selected. Complete the form below to send your request.`);
    const target = byId("booking");
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    if (eventDateInput) window.setTimeout(() => eventDateInput.focus({ preventScroll: true }), 450);
  });
}

if (eventDateInput) {
  eventDateInput.min = todayISODate();
  eventDateInput.addEventListener("input", syncEventDateValidity);
  eventDateInput.addEventListener("change", syncEventDateValidity);
}

if (byId("youtubeSubscribers")) { refreshYoutubeStats(); window.setInterval(refreshYoutubeStats, 15 * 60 * 1000); }
updateVideoSlider();
hydrateSiteContent();
loadYoutubeVideos();

