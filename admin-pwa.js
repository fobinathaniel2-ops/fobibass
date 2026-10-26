const ADMIN_PAGES = ['/admin', '/admin-login.html', '/manager.html'];

const isAdminPage = () => ADMIN_PAGES.includes(window.location.pathname.replace(/\/$/, '') || '/');

if ('serviceWorker' in navigator && isAdminPage()) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Admin app service worker registration failed:', error);
    });
  });
}

let installPrompt;
const installButton = document.getElementById('installAdminApp');
const installStatus = document.getElementById('installAdminStatus');

const setInstallStatus = (message) => {
  if (installStatus) installStatus.textContent = message;
};

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  if (installButton) installButton.hidden = false;
  setInstallStatus('The admin app is ready to install.');
});

installButton?.addEventListener('click', async () => {
  if (!installPrompt) {
    const browserHint = /Android/i.test(navigator.userAgent)
      ? 'Use your browser menu and choose “Install app” or “Add to Home screen”.'
      : 'Use the browser menu and choose “Install FOBI Admin”.';
    setInstallStatus(browserHint);
    return;
  }

  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  installButton.hidden = true;
});

window.addEventListener('appinstalled', () => {
  installPrompt = null;
  if (installButton) installButton.hidden = true;
  setInstallStatus('FOBI Admin is installed.');
});

if (window.location.pathname !== '/' && !installPrompt && installButton) {
  installButton.hidden = false;
  setInstallStatus('Installation availability depends on this browser and secure connection.');
}
