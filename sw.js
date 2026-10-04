/* Nicola's Barbershop service worker.
   Deliberately simple: pages always come from the network when online,
   so edits show straight away. The cache is only used if the phone is offline.
   Booking (book.html, Nearcut and any other site) is never cached. */
const CACHE = 'nicolas-shell-v2';
const SHELL = ['/offline', '/styles.css', '/site.js', '/assets/icon-192.png', '/assets/logo.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (/^\/book(\.html)?\/?$/.test(url.pathname)) {
    if (req.mode === 'navigate') {
      e.respondWith(fetch(req).catch(() => caches.match('/offline')));
    }
    return;
  }
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('/offline')))
    );
    return;
  }
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
