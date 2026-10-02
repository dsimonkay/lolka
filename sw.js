/* Twinkle Tails offline helper (optional).
   Put this file next to index.html on the website. It keeps a copy of the game
   on the phone so it still opens without internet. Online, it always loads the
   newest version first. If the website answers with an error page (e.g. 404
   because it was switched off), the saved copy is used instead. */
const CACHE = 'twinkle-tails-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

const saved = req =>
  caches.match(req, { ignoreSearch: true })
    .then(r => r || caches.match(new URL('./', self.registration.scope).href))
    .then(r => r || caches.match(new URL('./index.html', self.registration.scope).href));

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          return res;
        }
        return saved(req).then(r => r || res);
      })
      .catch(() => saved(req).then(r => r || Response.error()))
  );
});
