/* Everyday Leverage service worker: makes the app work offline after the first visit.
   - Pages: network first, falling back to the cached app shell.
   - Hashed build assets (/assets/*), fonts and the WASM kernel: cache first (they never change).
   - /api is never cached. */
const CACHE = 'el-v2';
const SHELL = ['/', '/index.html', '/favicon.svg'];

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
  if (url.pathname.startsWith('/assets/') || url.pathname.endsWith('.svg')) {
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
