/* React bridge offline shell. Business records stay exclusively in IndexedDB. */
const VERSION = '2.17.2-react-phase3b.1';
const CACHE = 'roseachy-shell-react-bridge-' + VERSION;
const FIXED = [
 '/manifest.json', '/js/pwa.js', '/js/android-sync-files.js',
 '/icons/roseachy-logo.svg', '/icons/icon-48.png', '/icons/icon-192.png',
 '/icons/icon-512.png', '/icons/icon-maskable-512.png', '/icons/apple-touch-icon.png',
 '/legacy/01-storage.js', '/legacy/02-product-match.js', '/legacy/03-core.js',
 '/legacy/04-tabs-indicator.js', '/legacy/05-title-fit.js',
 '/legacy/06-button-glint.js', '/legacy/07-boot-splash.js', '/legacy/08-ripple.js'
];

self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(CACHE);
  const page = await fetch(new Request('/index.html', { cache: 'reload' }));
  if (!page.ok) throw new Error('Could not cache the React entry HTML');
  const html = await page.text();
  await cache.put('/index.html', new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  }));
  const assets = new Set();
  // Vite emits hashed JS and CSS inside index.html.
  for (const match of html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)) assets.add(match[1]);
  // Required files must all be cached before this worker may install.
  await Promise.all([...assets, ...FIXED].map(url => cache.add(new Request(url, { cache: 'reload' }))));
})()));

self.addEventListener('activate', event => event.waitUntil((async () => {
  const names = await caches.keys();
  await Promise.all(names.filter(n => n.startsWith('roseachy-') && n !== CACHE).map(n => caches.delete(n)));
  await self.clients.claim();
})()));

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then(async response => {
      if (response.ok) (await caches.open(CACHE)).put('/index.html', response.clone()).catch(()=>{});
      return response;
    }).catch(async () => (await caches.open(CACHE)).match('/index.html') || new Response('Roseachy offline shell is unavailable', {status:503})));
    return;
  }
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(req, {ignoreSearch: true});
    if (cached) return cached;
    const response = await fetch(req);
    if (response.ok && response.type === 'basic') cache.put(req, response.clone()).catch(()=>{});
    return response;
  }));
});
