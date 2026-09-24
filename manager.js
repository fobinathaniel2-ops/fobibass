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
        detail: `${booking.name} • ${booking.event} • ${booking.date}`,
      });
    }

    if ((booking.status || "Pending") === "Pending") {
      notifications.push({
        title: "New booking request",
        detail: `${booking.name} • ${booking.event} • ${booking.date}`,
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

async function loadManager({ notify = false } = {}) {
  const response = await fetch("/api/admin/bookings");
  if (response.status === 401 || response.status === 403) { window.location.href = "admin-login.html"; return; }

  const data = await response.json();
  const bookings = data.bookings || [];

  try {
    const meResponse = await fetch("/api/auth/me");
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
    table.innerHTML = filtered.map((booking) => {
      const normalizedStatus = normalizeBookingStatus(booking.status);
      return `
        <tr>
          <td data-label="Name">${booking.name || ""}</td>
          <td data-label="Email">${booking.email || ""}</td>
          <td data-label="Phone">${booking.phone || ""}</td>
          <td data-label="Event">${booking.event || ""}</td>
          <td data-label="Date">${booking.date || ""}</td>
          <td data-label="Location">${booking.location || ""}</td>
          <td data-label="Status">
            <div class="booking-status-cell">
              <span class="status-badge ${getBookingStatusClass(normalizedStatus)}">${normalizedStatus}</span>
              <select class="booking-status-select" data-booking-id="${booking.id || ""}" aria-label="Change booking status for ${booking.name || "booking"}">
                ${BOOKING_STATUS_OPTIONS.map((option) => `<option value="${option}" ${option === normalizedStatus ? "selected" : ""}>${option}</option>`).join("")}
              </select>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  setText("bookingCount", bookings.length);
  setText("pendingCount", bookings.filter((item) => item.status === "Pending").length);
  setText("approvedCount", bookings.filter((item) => item.status === "Approved").length);
}

async function loadContent() {
  try {
    const response = await fetch("/api/content");
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

    if (availabilityList) {
      const items = data.availability || [];
      availabilityList.innerHTML = items.length
        ? items.map((item) => `<div class="list-item"><strong>${item.date}</strong><span>${item.event || "General availability"}</span><em>${item.status || "available"}</em></div>`).join("")
        : '<div class="list-empty">No availability saved yet.</div>';
    }

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

