const steps = { login: document.getElementById("stepLogin"), requestOtp: document.getElementById("stepRequestOtp"), verifyOtp: document.getElementById("stepVerifyOtp"), newPassword: document.getElementById("stepNewPassword") };
const otpShell = document.getElementById("otpShell");
const otpStatus = document.getElementById("otpStatus");
const showStep = (name) => Object.entries(steps).forEach(([key, element]) => element?.classList.toggle("active", key === name));
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

const setOtpState = (isBusy, message) => {
  if (otpShell) otpShell.classList.toggle("is-busy", isBusy);
  if (otpStatus) otpStatus.textContent = message || "We’re checking your secure code.";
};

document.getElementById("showForgotBtn")?.addEventListener("click", () => showStep("requestOtp"));
document.getElementById("backToLoginBtn1")?.addEventListener("click", () => showStep("login"));

const loginForm = document.getElementById("loginForm");
if (loginForm) loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const error = document.getElementById("loginError");
  const button = loginForm.querySelector("button[type=submit]");
  setLoadingState(button, true, "Logging in...");
  error.textContent = "";

  try {
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: document.getElementById("loginEmail").value, password: document.getElementById("loginPassword").value }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Incorrect email or password.");
    window.location.href = "client-dashboard.html";
  } catch (err) {
    error.textContent = err.message;
    setLoadingState(button, false, "Log In");
  }
});

let resetEmail = ""; let resetToken = "";

document.getElementById("requestOtpForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector("button[type=submit]");
  const success = document.getElementById("requestOtpSuccess");
  const error = document.getElementById("requestOtpError");

  resetEmail = document.getElementById("otpEmail").value.trim();
  success.textContent = "";
  error.textContent = "";
  setOtpState(false, "Sending your secure code...");
  setLoadingState(button, true, "Sending code...");

  try {
    const response = await fetch("/api/auth/request-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: resetEmail }) });
    const data = await response.json();
    success.textContent = data.message || "Code sent.";
    setOtpState(true, "Code sent. We’re waiting for your verification.");
    showStep("verifyOtp");
  } catch (err) {
    error.textContent = err.message || "Could not send reset code.";
  } finally {
    setLoadingState(button, false, "Send Code");
  }
});

document.getElementById("verifyOtpForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector("button[type=submit]");
  const error = document.getElementById("verifyOtpError");
  error.textContent = "";
  setLoadingState(button, true, "Verifying...");

  try {
    setOtpState(true, "Verifying your secure code...");
    const response = await fetch("/api/auth/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: resetEmail, otp: document.getElementById("otpCode").value }) });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Verification failed.");
    }
    resetToken = data.resetToken;
    setOtpState(false, "Code verified. You can now create your new password.");
    showStep("newPassword");
  } catch (err) {
    error.textContent = err.message;
  } finally {
    setLoadingState(button, false, "Verify Code");
  }
});

document.getElementById("newPasswordForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector("button[type=submit]");
  const error = document.getElementById("newPasswordError");
  const success = document.getElementById("newPasswordSuccess");
  error.textContent = "";
  success.textContent = "";
  setLoadingState(button, true, "Updating...");

  try {
    const response = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resetToken, newPassword: document.getElementById("newPassword").value }) });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Password reset failed.");
    }
    success.textContent = data.message;
    setTimeout(() => showStep("login"), 900);
  } catch (err) {
    error.textContent = err.message;
  } finally {
    setLoadingState(button, false, "Update Password");
  }
});
