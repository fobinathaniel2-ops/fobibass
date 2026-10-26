const ADMIN_CACHE = 'fobibass-admin-v1';
const SITE_CACHE = 'fobibass-site-v1';
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

const SITE_ASSETS = new Set([
  '/',
  '/index.html',
  '/style.css',
  '/style-premium.css',
  '/script.js',
  '/site-pwa.js',
  '/site-manifest.json',
  '/site-icon-192.png',
  '/site-icon-512.png'
]);

const isAdminRequest = (url) => ADMIN_ASSETS.has(url.pathname);
const isSiteRequest = (url) => SITE_ASSETS.has(url.pathname);

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(ADMIN_CACHE);
    await cache.addAll([...ADMIN_ASSETS].filter((path) => !path.endsWith('.json') || path === '/admin-manifest.json'));
    const siteCache = await caches.open(SITE_CACHE);
    await siteCache.addAll([...SITE_ASSETS]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => (key.startsWith('fobibass-admin-') && key !== ADMIN_CACHE) || (key.startsWith('fobibass-site-') && key !== SITE_CACHE)).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || (!isAdminRequest(url) && !isSiteRequest(url))) return;

  event.respondWith((async () => {
    const cache = await caches.open(isAdminRequest(url) ? ADMIN_CACHE : SITE_CACHE);
    const cached = await cache.match(event.request);
    if (cached) return cached;

    try {
      const response = await fetch(event.request);
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    } catch (error) {
      if (url.pathname === '/admin-login.html') return cache.match('/admin-login.html');
      if (url.pathname === '/index.html' || url.pathname === '/') return cache.match('/index.html');
      return Response.error();
    }
  })());
});
