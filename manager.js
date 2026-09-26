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

// In-page confirmation dialog (replaces the browser's confirm/prompt boxes). Resolves true or false.
const confirmModal = ({ title = "Are you sure?", message = "", confirmText = "Confirm", cancelText = "Cancel", danger = false } = {}) => new Promise((resolve) => {
  const modal = document.createElement("div");
  modal.className = "page-message-modal";
  modal.innerHTML = `
    <div class="page-message-modal-backdrop" data-cancel="true"></div>
    <div class="page-message-modal-card" role="alertdialog" aria-modal="true" aria-labelledby="confirmModalTitle">
      <div class="page-message-modal-header"><h3 id="confirmModalTitle"></h3></div>
      <p class="page-message-modal-message"></p>
      <div class="page-message-modal-actions is-split">
        <button type="button" class="page-message-modal-button is-secondary" data-cancel="true"></button>
        <button type="button" class="page-message-modal-button${danger ? " is-danger" : ""}" data-confirm="true"></button>
      </div>
    </div>
  `;
  modal.querySelector("#confirmModalTitle").textContent = title;
  modal.querySelector(".page-message-modal-message").textContent = message;
  modal.querySelector("[data-cancel].page-message-modal-button").textContent = cancelText;
  modal.querySelector("[data-confirm]").textContent = confirmText;

  const onKey = (event) => { if (event.key === "Escape") close(false); };
  const close = (result) => {
    document.removeEventListener("keydown", onKey);
    modal.remove();
    if (!document.querySelector(".page-message-modal")) document.body.classList.remove("page-modal-open");
    resolve(result);
  };

  modal.addEventListener("click", (event) => {
    if (event.target.closest("[data-confirm]")) close(true);
    else if (event.target.closest("[data-cancel]")) close(false);
  });
  document.addEventListener("keydown", onKey);
  document.body.appendChild(modal);
  document.body.classList.add("page-modal-open");
  modal.querySelector("[data-cancel].page-message-modal-button").focus();
});

const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "admin-login.html"; };
document.querySelectorAll("#logoutBtn, #profileLogoutBtn").forEach((button) => button.addEventListener("click", logout));

const bookingSound = new Audio("sound/Flashscore Notification.mp3");
bookingSound.preload = "auto";
let knownBookingCount = null;
const biometricToggle = document.getElementById("biometricToggle");
const biometricStatusText = document.getElementById("biometricStatusText");

const setBiometricStatusText = (enabled) => {
  if (biometricStatusText) {
    biometricStatusText.textContent = enabled
      ? "Biometric sign-in is enabled for this account."
      : "Biometric sign-in is currently off for this account.";
  }
};

const setText = (id, value) => {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
};

const formatTimestamp = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
};

const BOOKING_STATUS_OPTIONS = ["Pending", "Approved", "Rejected", "Completed", "Attended"];

// Escapes text coming from the public booking form before it is placed in the page.
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

const normalizeBookingStatus = (value) => {
  const status = String(value || "Pending").trim();
  return BOOKING_STATUS_OPTIONS.includes(status) ? status : "Pending";
};

const getBookingStatusClass = (status) => `status-${normalizeBookingStatus(status).toLowerCase()}`;

const renderNotifications = (bookings) => {
  const badge = document.getElementById("notificationBadge");
  const list = document.getElementById("notificationList");

  if (!badge || !list) return;

  const notifications = [];

  bookings.forEach((booking) => {
    if (booking.confirmationRequestSent) {
      notifications.push({
        title: "Attendance confirmation needed",
        detail: escapeHtml(`${booking.name} • ${booking.event} • ${booking.date}`),
      });
    }

    if ((booking.status || "Pending") === "Pending") {
      notifications.push({
        title: "New booking request",
        detail: escapeHtml(`${booking.name} • ${booking.event} • ${booking.date}`),
      });
    }
  });

  badge.textContent = String(notifications.length);

  if (!notifications.length) {
    list.innerHTML = "No new notifications";
    return;
  }

  list.innerHTML = notifications.map((item) => `
    <div class="notification-item">
      <span>${item.title}</span>
      <div>${item.detail}</div>
    </div>
  `).join("");
};

const getFilteredBookings = (bookings) => {
  const search = (document.getElementById("bookingSearch")?.value || "").trim().toLowerCase();
  const statusFilter = document.getElementById("bookingFilter")?.value || "All";

  return bookings.filter((booking) => {
    const matchesSearch = !search || [booking.name, booking.email, booking.event, booking.location].some((value) => String(value || "").toLowerCase().includes(search));
    const matchesStatus = statusFilter === "All" || (booking.status || "Pending") === statusFilter;
    return matchesSearch && matchesStatus;
  });
};

function formatBookingDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return String(value || "No date");
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function updateBookingChipCounts(bookings) {
  document.querySelectorAll("[data-count]").forEach((node) => {
    const key = node.dataset.count;
    node.textContent = key === "All" ? bookings.length : bookings.filter((item) => normalizeBookingStatus(item.status) === key).length;
  });
}

function renderAvailabilityList(data) {
  const list = document.getElementById("availabilityList");
  if (!list) return;
  const rows = data.availabilityOverview || [];
  const labels = { booked: "Booked", pending: "Requested", available: "Open" };

  list.innerHTML = rows.length ? rows.map((row) => {
    const day = String(row.date).match(/^(\d{4})-(\d{2})-(\d{2})/);
    const date = day ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3])) : null;
    const month = date ? date.toLocaleDateString(undefined, { month: "short" }) : "";
    const weekday = date ? date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "";
    const detail = row.source === "booking"
      ? `Booking &middot; ${escapeHtml(row.client)}${row.eventType ? " &middot; " + escapeHtml(row.eventType) : ""}`
      : (row.note ? escapeHtml(row.note) : (row.status === "booked" ? "Blocked by you" : "Marked open"));
    return `
      <div class="availability-row is-${row.status}">
        <div class="availability-date"><strong>${date ? date.getDate() : ""}</strong><span>${escapeHtml(month)}</span></div>
        <div class="availability-info">
          <span class="availability-badge is-${row.status}">${labels[row.status] || row.status}</span>
          <em>${detail}</em>
          <small>${escapeHtml(weekday)}</small>
        </div>
        ${row.source === "manual" ? `<button type="button" class="availability-remove" data-availability-id="${escapeHtml(row.id)}" aria-label="Remove this date entry"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>` : ""}
      </div>
    `;
  }).join("") : '<div class="list-empty">No upcoming booked or blocked dates. Your calendar is fully open.</div>';
}

async function refreshAvailabilityList() {
  const response = await fetch("/api/admin/content", { cache: "no-store" });
  if (!response.ok) return;
  renderAvailabilityList(await response.json());
}

async function loadManager({ notify = false } = {}) {
  const response = await fetch("/api/admin/bookings", { cache: "no-store" });
  if (response.status === 401 || response.status === 403) { window.location.href = "admin-login.html"; return; }

  const data = await response.json();
  const bookings = data.bookings || [];

  try {
    const meResponse = await fetch("/api/auth/me", { cache: "no-store" });
    const meData = await meResponse.json();
    const user = meData.user || {};

    setText("adminEmail", user.email || "Admin session");
    setText("lastLogin", formatTimestamp(user.lastLogin));
    if (biometricToggle) {
      biometricToggle.checked = Boolean(user.biometricEnabled);
      setBiometricStatusText(Boolean(user.biometricEnabled));
    }
  } catch (error) {
    console.warn("Profile info unavailable.", error.message);
  }

  if (notify && knownBookingCount !== null && bookings.length > knownBookingCount) {
    bookingSound.currentTime = 0;
    bookingSound.play().catch(() => {
      // Browsers may require one click on the manager page before allowing sound.
    });
  }

  knownBookingCount = bookings.length;
  const table = document.getElementById("bookingTable");
  const filtered = getFilteredBookings(bookings);

  renderNotifications(bookings);

  if (table) {
    table.innerHTML = filtered.length ? filtered.map((booking) => {
      const status = normalizeBookingStatus(booking.status);
      const id = escapeHtml(booking.id);
      const name = escapeHtml(booking.name);
      const email = escapeHtml(booking.email);
      const phone = escapeHtml(booking.phone);
      const quickActions = status === "Pending"
        ? `<button type="button" class="booking-action is-approve" data-quick-status="Approved" data-booking-id="${id}"><i class="fa-solid fa-check" aria-hidden="true"></i> Approve</button>
           <button type="button" class="booking-action is-reject" data-quick-status="Rejected" data-booking-id="${id}"><i class="fa-solid fa-xmark" aria-hidden="true"></i> Decline</button>`
        : "";
      return `
        <article class="booking-card is-${status.toLowerCase()}">
          <div class="booking-card-top">
            <div class="booking-card-title">
              <h3>${name}</h3>
              <p>${escapeHtml(booking.event)} &middot; ${escapeHtml(formatBookingDate(booking.date))}</p>
            </div>
            <span class="status-badge ${getBookingStatusClass(status)}">${status}</span>
          </div>
          <div class="booking-card-meta">
            <span><i class="fa-solid fa-location-dot" aria-hidden="true"></i>${escapeHtml(booking.location)}</span>
            <a href="mailto:${email}"><i class="fa-regular fa-envelope" aria-hidden="true"></i>${email}</a>
            <a href="tel:${phone}"><i class="fa-solid fa-phone" aria-hidden="true"></i>${phone}</a>
            ${booking.budget ? `<span><i class="fa-solid fa-coins" aria-hidden="true"></i>${escapeHtml(booking.budget)}</span>` : ""}
          </div>
          ${booking.message ? `<p class="booking-card-note">${escapeHtml(booking.message)}</p>` : ""}
          <div class="booking-card-actions">
            ${quickActions}
            <label class="booking-status-label">
              <span>Status</span>
              <select class="booking-status-select" data-booking-id="${id}" aria-label="Change booking status for ${name}">
                ${BOOKING_STATUS_OPTIONS.map((option) => `<option value="${option}" ${option === status ? "selected" : ""}>${option}</option>`).join("")}
              </select>
            </label>
            <button type="button" class="booking-delete-button" data-booking-id="${id}" data-booking-name="${name}" aria-label="Delete booking for ${name}"><i class="fa-solid fa-trash" aria-hidden="true"></i> Delete</button>
          </div>
        </article>
      `;
    }).join("") : `<div class="booking-empty"><i class="fa-regular fa-calendar" aria-hidden="true"></i><strong>${bookings.length ? "No bookings match this filter." : "No bookings yet."}</strong><span>${bookings.length ? "Try a different search or status." : "New requests from your website will appear here."}</span></div>`;
  }

  setText("bookingCount", bookings.length);
  setText("pendingCount", bookings.filter((item) => item.status === "Pending").length);
  setText("approvedCount", bookings.filter((item) => item.status === "Approved").length);
  updateBookingChipCounts(bookings);
}

async function loadContent() {
  try {
    const response = await fetch("/api/content", { cache: "no-store" });
    if (!response.ok) return;

    const data = await response.json();
    const settings = data.settings || {};
    const hero = settings.hero || {};
    const bio = settings.bio || {};
    const contact = settings.contact || {};
    const socials = settings.socials || {};

    const heroTitle = document.getElementById("heroTitle");
    const heroSubtitle = document.getElementById("heroSubtitle");
    const bioText = document.getElementById("bioText");
    const contactPhone = document.getElementById("contactPhone");
    const contactEmail = document.getElementById("contactEmail");
    const contactLocation = document.getElementById("contactLocation");
    const socialYoutube = document.getElementById("socialYoutube");
    const socialInstagram = document.getElementById("socialInstagram");
    const socialTikTok = document.getElementById("socialTikTok");
    const socialX = document.getElementById("socialX");

    if (heroTitle && hero.title) heroTitle.value = hero.title;
    if (heroSubtitle && hero.subtitle) heroSubtitle.value = hero.subtitle;
    if (bioText && bio.bio) bioText.value = bio.bio;
    if (contactPhone) contactPhone.value = contact.phone || "";
    if (contactEmail) contactEmail.value = contact.email || "";
    if (contactLocation) contactLocation.value = contact.location || "";
    if (socialYoutube) socialYoutube.value = socials.youtube || "";
    if (socialInstagram) socialInstagram.value = socials.instagram || "";
    if (socialTikTok) socialTikTok.value = socials.tiktok || "";
    if (socialX) socialX.value = socials.x || "";

    const availabilityList = document.getElementById("availabilityList");
    const videosList = document.getElementById("videoList");
    const servicesList = document.getElementById("serviceList");

    refreshAvailabilityList().catch(() => {});

    if (videosList) {
      const items = data.videos || [];
      videosList.innerHTML = items.length
        ? items.map((item) => `
          <div class="video-card">
            <div class="video-preview">
              ${item.url ? `<video controls preload="metadata" src="${item.url}"></video>` : (item.cover ? `<img src="${item.cover}" alt="${item.title || "Uploaded media"}">` : `<div class="video-placeholder"><i class="fa-solid fa-video" aria-hidden="true"></i></div>`)}
            </div>
            <div class="video-meta">
              <div>
                <strong>${item.title || "Untitled video"}</strong>
                <span>${item.category || "video"}</span>
              </div>
              <a href="${item.url || item.cover || "#"}" target="_blank" rel="noopener">Open</a>
            </div>
          </div>
        `).join("")
        : '<div class="list-empty">No videos added yet.</div>';
    }

    if (servicesList) {
      const items = data.services || [];
      servicesList.innerHTML = items.length
        ? items.map((item) => `<div class="list-item"><strong>${item.name}</strong><span>${item.description || ""}</span></div>`).join("")
        : '<div class="list-empty">No services saved yet.</div>';
    }

  } catch (error) {
    console.warn("Content loader unavailable", error.message);
  }
}

const saveContent = async (url, payload) => {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
};

const bindForm = (formId, route, payloadBuilder) => {
  const form = document.getElementById(formId);
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      await saveContent(`/api/admin/content/${route}`, payloadBuilder(new FormData(form)));
      await loadContent();
      showPageMessageModal({ title: "Saved", message: "Saved successfully.", buttonText: "Done" });
    } catch (error) {
      showPageMessageModal({ title: "Save failed", message: error.message || "Could not save.", buttonText: "Try again" });
    }
  });
};

bindForm("heroForm", "hero", (formData) => ({ title: formData.get("heroTitle") || "", subtitle: formData.get("heroSubtitle") || "" }));
bindForm("bioForm", "bio", (formData) => ({ bio: formData.get("bioText") || "" }));
bindForm("contactForm", "contact", (formData) => ({ phone: formData.get("contactPhone") || "", email: formData.get("contactEmail") || "", location: formData.get("contactLocation") || "" }));
bindForm("socialForm", "socials", (formData) => ({ youtube: formData.get("socialYoutube") || "", instagram: formData.get("socialInstagram") || "", tiktok: formData.get("socialTikTok") || "", x: formData.get("socialX") || "" }));
bindForm("availabilityForm", "availability", (formData) => ({ date: formData.get("availableDate") || "", status: formData.get("availabilityStatus") || "available", event: formData.get("availabilityEvent") || "" }));
bindForm("serviceForm", "services", (formData) => ({ name: formData.get("serviceName") || "", description: formData.get("serviceDescription") || "" }));

const videoForm = document.getElementById("videoForm");
if (videoForm) {
  videoForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = videoForm.querySelector("button[type=submit]");
    const status = document.getElementById("videoUploadStatus");
    const fileInput = document.getElementById("videoFile");
    const coverInput = document.getElementById("videoCoverFile");
    const formData = new FormData(videoForm);
    const title = String(formData.get("videoTitle") || "").trim();
    const category = String(formData.get("videoCategory") || "video").trim() || "video";
    const videoFile = fileInput?.files?.[0];
    const coverFile = coverInput?.files?.[0];

    if (!title) {
      status.textContent = "Please enter a video title.";
      return;
    }

    if (!videoFile) {
      status.textContent = "Please choose a video file to upload.";
      return;
    }

    const setButtonState = (isLoading) => {
      if (!button) return;
      button.disabled = isLoading;
      button.innerHTML = isLoading
        ? '<span class="button-spinner" aria-hidden="true"></span><span>Uploading...</span>'
        : '<i class="fa-solid fa-upload" aria-hidden="true"></i> Save Video';
    };

    try {
      setButtonState(true);
      status.textContent = "Uploading video to Cloudinary...";

      const uploadFile = async (uploadFileInput, kind) => {
        if (!uploadFileInput) return "";
        const uploadForm = new FormData();
        uploadForm.append("file", uploadFileInput);
        uploadForm.append("category", kind);

        const response = await fetch("/api/media/upload", { method: "POST", body: uploadForm });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || "Upload failed.");
        }

        return data.url || "";
      };

      const videoUrl = await uploadFile(videoFile, "video");
      const coverUrl = coverFile ? await uploadFile(coverFile, "gallery") : "";

      await saveContent("/api/admin/content/videos", {
        title,
        category,
        url: videoUrl,
        cover: coverUrl,
      });

      await loadContent();
      videoForm.reset();
      status.textContent = "Video saved and published successfully.";
    } catch (error) {
      status.textContent = error.message || "Could not save the video.";
    } finally {
      setButtonState(false);
    }
  });
}

const passwordForm = document.getElementById("passwordForm");

if (passwordForm) {
  passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(passwordForm);
    const currentPassword = String(formData.get("currentPassword") || "").trim();
    const newPassword = String(formData.get("newPassword") || "").trim();

    if (!currentPassword || !newPassword) {
      showPageMessageModal({ title: "Password update failed", message: "Both password fields are required.", buttonText: "Try again" });
      return;
    }

    if (newPassword.length < 8) {
      showPageMessageModal({ title: "Password update failed", message: "New password must be at least 8 characters long.", buttonText: "Try again" });
      return;
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not update password.");
      passwordForm.reset();
      showPageMessageModal({ title: "Password updated", message: data.message || "Your password was updated successfully.", buttonText: "Done" });
    } catch (error) {
      showPageMessageModal({ title: "Password update failed", message: error.message || "Could not update password.", buttonText: "Try again" });
    }
  });
}

const bookingSearch = document.getElementById("bookingSearch");
const bookingFilter = document.getElementById("bookingFilter");
const bookingFilterButton = document.getElementById("bookingFilterButton");
const bookingFilterCurrent = document.getElementById("bookingFilterCurrent");
const bookingFilterMenu = document.getElementById("bookingFilterMenu");
const bookingFilterOptions = Array.from(document.querySelectorAll(".booking-filter-option"));

const updateBookingFilterUI = (value) => {
  const option = bookingFilterOptions.find((item) => item.dataset.value === value) || bookingFilterOptions[0];
  if (bookingFilter) bookingFilter.value = option?.dataset.value || "All";
  if (bookingFilterCurrent) bookingFilterCurrent.textContent = option?.textContent || "All Bookings";
  bookingFilterOptions.forEach((item) => item.classList.toggle("is-active", item.dataset.value === (option?.dataset.value || "All")));
};

const updateBookingStatus = async (bookingId, status) => {
  const response = await fetch(`/api/admin/bookings/${encodeURIComponent(bookingId)}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Could not update booking status.");
  }

  await loadManager();
  refreshAvailabilityList().catch(() => {});
};

if (bookingSearch) bookingSearch.addEventListener("input", () => loadManager().catch(() => {}));

if (bookingFilterButton && bookingFilterMenu) {
  bookingFilterButton.addEventListener("click", () => {
    const isOpen = bookingFilterMenu.classList.contains("is-open");
    bookingFilterMenu.classList.toggle("is-open", !isOpen);
    bookingFilterButton.setAttribute("aria-expanded", String(!isOpen));
  });
}

bookingFilterOptions.forEach((option) => {
  option.addEventListener("click", () => {
    updateBookingFilterUI(option.dataset.value || "All");
    if (bookingFilterMenu) bookingFilterMenu.classList.remove("is-open");
    if (bookingFilterButton) bookingFilterButton.setAttribute("aria-expanded", "false");
    loadManager().catch(() => {});
  });
});

document.addEventListener("click", (event) => {
  if (!bookingFilterMenu || !bookingFilterButton) return;
  const clickedInside = bookingFilterMenu.contains(event.target) || bookingFilterButton.contains(event.target);
  if (!clickedInside) {
    bookingFilterMenu.classList.remove("is-open");
    bookingFilterButton.setAttribute("aria-expanded", "false");
  }
});

document.addEventListener("change", async (event) => {
  const select = event.target.closest(".booking-status-select");
  if (!select) return;

  try {
    await updateBookingStatus(select.dataset.bookingId, select.value);
  } catch (error) {
    showPageMessageModal({ title: "Booking update failed", message: error.message || "Could not update booking status.", buttonText: "Try again" });
    loadManager().catch(() => {});
  }
});

const refreshAfterBookingChange = async () => {
  await loadManager();
  refreshAvailabilityList().catch(() => {});
};

const deleteBooking = async (bookingId, name) => {
  const confirmed = await confirmModal({
    title: "Delete this booking?",
    message: `${name ? "The booking from " + name : "This booking"} will be removed permanently. This cannot be undone.`,
    confirmText: "Delete",
    danger: true,
  });
  if (!confirmed) return;

  try {
    const response = await fetch("/api/admin/bookings/" + encodeURIComponent(bookingId) + "/delete", { method: "POST" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not delete booking.");
    await refreshAfterBookingChange();
  } catch (error) {
    showPageMessageModal({ title: "Delete failed", message: error.message || "Could not delete booking.", buttonText: "Try again" });
  }
};

const clearAllBookings = async () => {
  const count = Number(document.getElementById("bookingCount")?.textContent) || 0;
  if (!count) {
    showPageMessageModal({ title: "Nothing to clear", message: "There are no bookings to clear.", buttonText: "OK" });
    return;
  }

  const confirmed = await confirmModal({
    title: "Clear all bookings?",
    message: `This permanently deletes all ${count} booking${count === 1 ? "" : "s"} and the client accounts created from them. This cannot be undone.`,
    confirmText: "Clear all",
    danger: true,
  });
  if (!confirmed) return;

  try {
    const response = await fetch("/api/admin/bookings/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "DELETE" }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not clear bookings.");
    await refreshAfterBookingChange();
    showPageMessageModal({ title: "Bookings cleared", message: "Removed " + data.removedBookings + " booking(s).", buttonText: "Done" });
  } catch (error) {
    showPageMessageModal({ title: "Clear failed", message: error.message || "Could not clear bookings.", buttonText: "Try again" });
  }
};

const removeAvailabilityEntry = async (entryId) => {
  const confirmed = await confirmModal({
    title: "Remove this date?",
    message: "This removes your manual entry. The date goes back to the calendar's normal state.",
    confirmText: "Remove",
    danger: true,
  });
  if (!confirmed) return;

  try {
    const response = await fetch("/api/admin/content/availability/" + encodeURIComponent(entryId) + "/delete", { method: "POST" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not remove the date.");
    await refreshAvailabilityList();
  } catch (error) {
    showPageMessageModal({ title: "Remove failed", message: error.message || "Could not remove the date.", buttonText: "Try again" });
  }
};

document.addEventListener("click", async (event) => {
  const deleteButton = event.target.closest(".booking-delete-button");
  if (deleteButton) {
    deleteBooking(deleteButton.dataset.bookingId, deleteButton.dataset.bookingName);
    return;
  }

  const quickButton = event.target.closest("[data-quick-status]");
  if (quickButton) {
    quickButton.disabled = true;
    try {
      await updateBookingStatus(quickButton.dataset.bookingId, quickButton.dataset.quickStatus);
    } catch (error) {
      showPageMessageModal({ title: "Booking update failed", message: error.message || "Could not update booking status.", buttonText: "Try again" });
      loadManager().catch(() => {});
    }
    return;
  }

  const removeButton = event.target.closest(".availability-remove");
  if (removeButton) removeAvailabilityEntry(removeButton.dataset.availabilityId);
});

const clearBookingsBtn = document.getElementById("clearBookingsBtn");
if (clearBookingsBtn) clearBookingsBtn.addEventListener("click", clearAllBookings);

if (bookingFilter) {
  updateBookingFilterUI(bookingFilter.value || "All");
}

if (biometricToggle) {
  biometricToggle.addEventListener("change", async () => {
    try {
      const response = await fetch("/api/admin/biometric-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: biometricToggle.checked }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not update biometric access.");
      setBiometricStatusText(Boolean(data.biometricEnabled));
    } catch (error) {
      showPageMessageModal({ title: "Biometric update failed", message: error.message || "Could not update biometric access.", buttonText: "Ok" });
      biometricToggle.checked = !biometricToggle.checked;
    }
  });
}

loadManager().catch(() => { window.location.href = "admin-login.html"; });
loadContent().catch(() => {});
window.setInterval(() => loadManager({ notify: true }).catch(() => {}), 30000);

