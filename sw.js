// Family Call - Always Online Service Worker - V20 - Auto Cache Clear
const CACHE = 'family-call-v20-NEW';
let onlineInfo = null;

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './index.html', './manifest.json'])));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => { if(k !== CACHE) return caches.delete(k); })
    )).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  // HTML hamesha Network se lo, Cache se nahi - taaki naya UI turant aaye
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(res => {
        let copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'KEEP_ONLINE') {
    onlineInfo = e.data;
    keepAlivePing();
  }
  if (e.data && e.data.type === 'LOGOUT') {
    onlineInfo = null;
  }
});
async function keepAlivePing() {
  if (!onlineInfo || !onlineInfo.number) return;
  try {
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    clients.forEach(c => c.postMessage({ type: 'PING_ONLINE' }));
  } catch (e) {}
}
setInterval(() => { keepAlivePing(); }, 20000);
self.addEventListener('periodicsync', e => {
  if (e.tag === 'keep-online') e.waitUntil(keepAlivePing());
});
