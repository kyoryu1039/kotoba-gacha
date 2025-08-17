// sw.js
const VERSION = 'v1.0.0';
const CACHE_NAME = `kotoba-cache-${VERSION}`;

// ここに必ず欲しいコアをプリキャッシュ
const CORE_ASSETS = [
  './',
  './index.html',
  './kotobattle.html',
  './nekologia.html',
  './manifest.webmanifest',
  // 代表的なアセット（存在するものだけでOK）
  './audio/Hypnagogiaondo.mp3',
  './audio/Nekologia.mp3',
  './images/necologia_banner.jpg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    ).then(() => self.clients.claim())
  );
});

// 取得は「キャッシュ優先・なければネット」
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 同一オリジンのみキャッシュ（CDN等は素通し）
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;

        return fetch(req).then((res) => {
          // 成功したGETだけ保存
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        }).catch(() => {
          // オフライン時のフォールバック（必要なら差し替え）
          if (req.destination === 'document') return caches.match('./index.html');
        });
      })
    );
  }
});
