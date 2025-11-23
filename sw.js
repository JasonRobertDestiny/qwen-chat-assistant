// Service Worker for PWA support (network-first for API，缓存静态)
const CACHE_NAME = 'chat-assistant-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js?v=20251123',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
  '/favicon.ico'
];

// 安装事件
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('缓存已打开');
        return cache.addAll(urlsToCache);
      })
  );
  // 新版本立即接管
  self.skipWaiting();
});

// 获取事件
self.addEventListener('fetch', function(event) {
  const { request } = event;

  // 对 API 或非 GET 请求直接走网络，避免缓存干扰
  if (request.method !== 'GET' || request.url.includes('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        // 网络不可达时返回明确的 503，避免控制台抛未处理异常
        if (request.url.includes('/api/')) {
          return new Response(
            JSON.stringify({ error: 'offline', message: 'API not reachable' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        }
        // 非 API 请求返回空响应，避免报错
        return new Response('', { status: 504 });
      })
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then(function(networkResponse) {
        // 缓存成功的 GET 资源
        const respClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, respClone));
        return networkResponse;
      })
      .catch(function() {
        return caches.match(request).then(function(response) {
          if (response) return response;
          // 兜底返回首页，避免报错
          return caches.match('/');
        });
      })
  );
});

// 激活事件
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('删除旧缓存:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
