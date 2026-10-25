/* Everyday Leverage service worker: makes the app work offline after the first visit.
   - Pages: network first, falling back to the cached app shell.
   - Hashed build assets (/assets/*), fonts, the WASM kernel and the design renders: cache first.
   - /api is never cached. */
// Bump on any change to an unhashed file (icons, renders, sw logic): the old cache is then deleted.
const CACHE = 'el-v4';
const SHELL = ['/', '/index.html', '/favicon.svg?v=3', '/favicon-32.png?v=3', '/apple-touch-icon.png?v=3'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then(async (c) => {
        await c.addAll(SHELL);
        // Precache every built asset so pages not visited yet also work offline.
        try {
          const list = await (await fetch('/precache.json', { cache: 'no-store' })).json();
          await c.addAll(list);
        } catch {
          // Optional: runtime caching still covers what gets used.
        }
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/index.html', copy));
          return res;
        })
        .catch(() => caches.match('/index.html')),
    );
    return;
  }
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/renders/') || url.pathname.endsWith('.svg')) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
});
