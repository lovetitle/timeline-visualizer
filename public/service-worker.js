const CACHE_NAME = 'timeline-visualizer-web-v3';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(['./', './index.html', './icon.svg'])));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method === 'POST' && new URL(request.url).pathname.endsWith('/')) {
    event.respondWith((async () => {
      try {
        const form = await request.formData();
        const file = form.get('timeline');
        if (file instanceof File) {
          const buffer = await file.arrayBuffer();
          const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
          for (const client of clientsList) {
            client.postMessage({
              type: 'SHARE_TARGET_FILE',
              name: file.name,
              mime: file.type,
              buffer,
            });
          }
        }
      } catch {
        // fall through to redirect home
      }
      return Response.redirect('./', 303);
    })());
    return;
  }
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      } catch {
        return (await cache.match(request)) ?? Response.error();
      }
    }),
  );
});
