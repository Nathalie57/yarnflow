// [AI:Claude] Chargé par le service worker généré par Vite-PWA via
// workbox.importScripts (voir vite.config.js). Le SW généré (stratégie
// generateSW) écrase entièrement public/sw.js à chaque build — ce fichier,
// lui, n'a pas ce nom donc il n'est jamais écrasé, et Workbox l'injecte
// avec importScripts() au démarrage du SW généré.

// Web Share Target : le manifest déclare une action POST vers /share
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

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method === 'POST' && url.pathname === '/share') {
    event.respondWith(handleShareTarget(event));
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
