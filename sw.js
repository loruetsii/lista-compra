const V = "v1";
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(["./", "index.html", "config.js", "manifest.webmanifest"])));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((k) => Promise.all(k.filter((x) => x !== V).map((x) => caches.delete(x)))).then(() => clients.claim())
  );
});
const guardar = (req, r) => { const c = r.clone(); caches.open(V).then((x) => x.put(req, c)); return r; };
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.hostname.endsWith("supabase.co")) return;
  if (u.origin === location.origin) {
    // App y catálogo: red primero, caché si no hay conexión (en el súper suele fallar la cobertura)
    e.respondWith(fetch(e.request).then((r) => guardar(e.request, r)).catch(() => caches.match(e.request)));
  } else if (u.hostname.includes("imgix")) {
    // Fotos de producto: caché primero
    e.respondWith(caches.match(e.request).then((m) => m || fetch(e.request).then((r) => guardar(e.request, r))));
  }
});
