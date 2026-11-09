const CACHE_NAME = "yuan-model-v1";
const MODEL_URL = new URL(
  "3d-model/generated_model_20261109_103623.glb",
  self.registration.scope,
);

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((name) => name.startsWith("yuan-model-") && name !== CACHE_NAME)
        .map((name) => caches.delete(name)),
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const requestUrl = new URL(request.url);

  if (
    request.method !== "GET"
    || requestUrl.origin !== MODEL_URL.origin
    || requestUrl.pathname !== MODEL_URL.pathname
  ) return;

  event.respondWith((async () => {
    let cache;

    try {
      cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(request);
      if (cachedResponse) return cachedResponse;
    } catch (error) {
      console.warn("Portrait cache unavailable:", error);
    }

    const response = await fetch(request);
    if (cache && response.ok) {
      try {
        await cache.put(request, response.clone());
      } catch (error) {
        console.warn("Portrait could not be saved to cache:", error);
      }
    }

    return response;
  })());
});
