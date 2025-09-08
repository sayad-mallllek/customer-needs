self.addEventListener("install", (e) => {
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  clients.claim();
});
const CACHE = "cn-static-v1";
const ASSETS = ["/", "/index.html"];
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (url.origin === location.origin) {
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        const res = await fetch(e.request);
        if (
          res.status === 200 &&
          res.headers.get("content-type")?.includes("text")
        ) {
          cache.put(e.request, res.clone());
        }
        return res;
      })
    );
  }
});
