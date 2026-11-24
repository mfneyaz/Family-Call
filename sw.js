// Family Call - Always Online Service Worker
const CACHE = 'family-call-v18';
let onlineInfo = null;

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './index.html', './manifest.json'])));
});
self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'KEEP_ONLINE') {
    onlineInfo = e.data;
    // SW se bhi Online ping - App band ho to bhi
    keepAlivePing();
  }
  if (e.data && e.data.type === 'LOGOUT') {
    onlineInfo = null;
  }
});
async function keepAlivePing() {
  if (!onlineInfo || !onlineInfo.number) return;
  // Har 20 sec me ek baar SW jagta rahega
  try {
    // MQTT ko SW se direct ping nahi kar sakte, isliye Client ko jagate hain
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    clients.forEach(c => c.postMessage({ type: 'PING_ONLINE' }));
  } catch (e) {}
}
setInterval(() => { keepAlivePing(); }, 20000);
self.addEventListener('periodicsync', e => {
  if (e.tag === 'keep-online') e.waitUntil(keepAlivePing());
});
