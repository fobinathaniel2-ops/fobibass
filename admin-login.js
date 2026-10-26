import { parseRequestOptions, serializeAssertion } from './admin-biometric.js';

const form = document.getElementById("loginForm");
const error = document.getElementById("errorMessage");
const biometricStatus = document.getElementById("biometricStatus");
const biometricLoginBtn = document.getElementById("biometricLoginBtn");
const emailInput = document.getElementById("email");

const setBiometricStatus = (message, tone = "neutral") => {
  if (!biometricStatus) return;
  biometricStatus.textContent = message;
  biometricStatus.classList.remove("error-text", "success-text");
  if (tone === "error") biometricStatus.classList.add("error-text");
  if (tone === "success") biometricStatus.classList.add("success-text");
};

const setBiometricVisibility = (visible, message = "Biometric sign-in is available only after this admin account has been granted access from the dashboard.") => {
  if (biometricLoginBtn) biometricLoginBtn.hidden = !visible;
  if (biometricStatus) setBiometricStatus(message, visible ? "success" : "neutral");
};

const setLoadingState = (button, isLoading, label) => {
  if (!button) return;
  const originalHtml = button.dataset.originalHtml || button.innerHTML;
  button.dataset.originalHtml = originalHtml;
  button.disabled = isLoading;
  button.classList.toggle("is-loading", isLoading);
  button.innerHTML = isLoading
    ? `<span class="button-spinner" aria-hidden="true"></span><span>${label}</span>`
    : originalHtml;
};

const checkBiometricAccess = async () => {
  const email = emailInput?.value.trim().toLowerCase();

  if (!email) {
    setBiometricVisibility(false, "Biometric sign-in is available only after this admin account has been granted access from the dashboard.");
    return;
  }

  if (!window.isSecureContext || !window.PublicKeyCredential || typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== "function") {
    setBiometricVisibility(false, "Biometric sign-in needs a secure browser context. Use email/password on this device for now.");
    return;
  }

  try {
    const response = await fetch(`/api/auth/biometric-status?email=${encodeURIComponent(email)}`);
    const data = await response.json().catch(() => ({}));
    const enabled = Boolean(data.biometricEnabled);
    const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

    if (!enabled || !available) {
      setBiometricVisibility(false, enabled ? "A supported biometric authenticator was not found on this device." : "Biometric sign-in is available only after this admin account has been granted access from the dashboard.");
      return;
    }

    setBiometricVisibility(true, "Biometric sign-in is available on this device for this admin account.");
  } catch (error) {
    setBiometricVisibility(false, "Biometric sign-in is available only after this admin account has been granted access from the dashboard.");
  }
};

emailInput?.addEventListener("input", () => {
  checkBiometricAccess().catch(() => {});
});

checkBiometricAccess().catch(() => {});

biometricLoginBtn?.addEventListener("click", async () => {
  const email = document.getElementById("email")?.value.trim();
  if (!email) {
    setBiometricStatus("Enter your admin email first, then retry biometric login.", "error");
    return;
  }

  if (!window.isSecureContext || !window.PublicKeyCredential || typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== "function") {
    setBiometricStatus("This browser cannot run biometric sign-in yet. Please use your email and password.", "error");
    return;
  }

  try {
    const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!available) {
      setBiometricStatus("No supported biometric authenticator is available on this device yet.", "error");
      return;
    }

    setBiometricStatus("Requesting your registered passkey...", "neutral");
    const optionsResponse = await fetch("/api/auth/biometric-login-options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const options = await optionsResponse.json().catch(() => ({}));
    if (!optionsResponse.ok) throw new Error(options.error || "No registered passkey was found.");

    const credential = await navigator.credentials.get({
      mediation: "required",
      publicKey: parseRequestOptions(options)
    });
    if (!credential) throw new Error("Biometric sign-in was cancelled.");

    const response = await fetch("/api/auth/biometric-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, credential: serializeAssertion(credential) })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Biometric sign-in failed.");
    setBiometricStatus("Biometric sign-in successful. Opening the dashboard...", "success");
    window.location.href = "manager.html";
  } catch (err) {
    const message = err?.message || "No registered biometric credential was found on this device.";
    setBiometricStatus(`Biometric sign-in is not configured yet for this account: ${message}`, "error");
  }
});

if (form) form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = form.querySelector("button[type=submit]");
  setLoadingState(button, true, "Logging in...");
  error.textContent = "";

  try {
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: document.getElementById("email").value, password: document.getElementById("password").value }) });
    const data = await response.json();
    if (!response.ok || data.user?.role !== "admin") throw new Error("Admin access denied.");
    window.location.href = "manager.html";
  } catch (err) {
    error.textContent = err.message || "Login failed.";
    setLoadingState(button, false, "Login");
  }
});

const forgot = document.getElementById("forgotPassword");
if (forgot) forgot.addEventListener("click", async (event) => {
  event.preventDefault();
  const email = document.getElementById("email").value.trim();
  if (!email) {
    error.textContent = "Enter your email first.";
    return;
  }

  const button = document.getElementById("loginButton");
  setLoadingState(button, true, "Sending...");

  try {
    await fetch("/api/admin/request-password-reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    error.textContent = "If the account exists, reset instructions were sent.";
  } catch (err) {
    error.textContent = err.message || "Could not send reset instructions.";
  } finally {
    setLoadingState(button, false, "Login");
  }
});
