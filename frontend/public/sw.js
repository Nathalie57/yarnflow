// YarnFlow Service Worker v0.17.1
// Cache strategy for PWA functionality

const CACHE_NAME = 'yarnflow-v0.17.1';
const API_CACHE = 'yarnflow-api-v1';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control immediately
  );
});

// [AI:Claude] Web Share Target : le manifest déclare une action POST vers /share
// (title/text/url + image). Le navigateur fait une vraie navigation POST — un
// composant React classique ne peut pas lire ce corps de requête, seul le service
// worker le peut. On extrait les champs texte et on redirige en GET vers Smart
// Creation, pré-rempli, pour laisser l'utilisatrice confirmer avant analyse
// (jamais d'analyse IA déclenchée automatiquement sans son clic).
async function handleShareTarget(event) {
  const formData = await event.request.formData();
  const sharedUrl = formData.get('url') || '';
  const sharedText = formData.get('text') || '';
  const sharedTitle = formData.get('title') || '';

  const params = new URLSearchParams();
  if (sharedUrl) params.set('shared_url', sharedUrl);
  if (sharedText) params.set('shared_text', sharedText);
  if (sharedTitle) params.set('shared_title', sharedTitle);

  return Response.redirect(`/smart-project-creator?${params.toString()}`, 303);
}

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method === 'POST' && url.pathname === '/share') {
    event.respondWith(handleShareTarget(event));
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API requests - Network First (always fresh data)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets - Cache First (fast loading)
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((response) => {
          // Cache successful responses
          if (response.ok &&
              (url.origin === location.origin ||
               url.pathname.match(/\.(png|jpg|jpeg|svg|css|js|woff2?)$/))) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
  );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'YarnFlow', body: event.data.text(), url: '/' };
  }

  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icons/icon-192x192.png',
    badge: payload.badge || '/icons/icon-72x72.png',
    data: { url: payload.url || '/' },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || 'YarnFlow', options)
  );
});

// Clic sur la notification → ouvrir/focus l'app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

console.log('[SW] YarnFlow Service Worker loaded');
