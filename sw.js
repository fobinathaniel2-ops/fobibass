const ADMIN_CACHE = 'fobibass-admin-v1';
const ADMIN_ASSETS = new Set([
  '/admin-login.html',
  '/admin-login.css',
  '/auth-premium.css',
  '/admin-login.js',
  '/admin-pwa.js',
  '/admin-manifest.json',
  '/admin-icon-192.png',
  '/admin-icon-512.png',
  '/manager.html',
  '/manager.css',
  '/manager-premium.css',
  '/manager.js'
]);

const isAdminRequest = (url) => ADMIN_ASSETS.has(url.pathname);

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(ADMIN_CACHE);
    await cache.addAll([...ADMIN_ASSETS].filter((path) => !path.endsWith('.json') || path === '/admin-manifest.json'));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith('fobibass-admin-') && key !== ADMIN_CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !isAdminRequest(url)) return;

  event.respondWith((async () => {
    const cache = await caches.open(ADMIN_CACHE);
    const cached = await cache.match(event.request);
    if (cached) return cached;

    try {
      const response = await fetch(event.request);
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    } catch (error) {
      return url.pathname === '/admin-login.html'
        ? cache.match('/admin-login.html')
        : Response.error();
    }
  })());
});
