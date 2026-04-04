// Service Worker for PWA offline support
const CACHE_NAME = 'gokaku-v1';
const STATIC_CACHE = 'gokaku-static-v1';
const DYNAMIC_CACHE = 'gokaku-dynamic-v1';

// 静态资源缓存列表
const STATIC_ASSETS = [
  '/',
  '/tool',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 请求拦截 - 缓存策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API 请求：网络优先，失败时返回离线提示
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 克隆响应并缓存
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // 网络失败，尝试从缓存读取
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            // 返回离线提示
            return new Response(
              JSON.stringify({ error: '网络连接失败，请检查网络后重试' }),
              {
                headers: { 'Content-Type': 'application/json' },
                status: 503,
              }
            );
          });
        })
    );
    return;
  }

  // 静态资源：缓存优先
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image'
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const responseClone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }

  // 页面请求：网络优先，失败时使用缓存
  event.respondWith(
    fetch(request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // 返回离线页面
          return caches.match('/');
        });
      })
  );
});

// 后台同步 - 离线时保存数据，恢复网络后同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queries') {
    event.waitUntil(syncQueries());
  }
});

async function syncQueries() {
  // 从 IndexedDB 读取离线时保存的查询
  // 发送到服务器
  // 这里需要配合前端 IndexedDB 实现
  console.log('Background sync: syncing offline queries');
}

// 推送通知
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '合格道提醒';
  const options = {
    body: data.body || '每日一练已更新',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: data.url || '/practice',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 通知点击
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data || '/practice')
  );
});
