// T&T – Service Worker: cho phép mở app khi mạng yếu (giao diện), luôn ưu tiên bản mới nhất.
// KHÔNG lưu đệm các yêu cầu tới Google Gemini.
const CACHE = 'tt-sodt-v1';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './index.html', './manifest.webmanifest', './icons/icon-192.png'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return; // Gemini & bên ngoài: đi thẳng mạng
  if (req.mode === 'navigate') {
    // Trang chính: lấy mạng trước (để luôn có bản mới), mất mạng thì dùng bản đã lưu
    e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./index.html', copy)); return res; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // Tài nguyên (js/css/ảnh có mã hash): dùng bản đã lưu, chưa có thì tải và lưu
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  })));
});
