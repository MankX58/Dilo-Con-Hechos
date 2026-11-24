// Sin conexión: primero la red (siempre la versión más nueva); si no hay señal, la copia guardada.
// La IA (/api) nunca se guarda: sin conexión, la app usa el revisor por criterios.
const CACHE = "dilo-con-hechos-v1";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.add("/")));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.pathname.startsWith("/api/")) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok || res.type === "opaque") {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
        }
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || (req.mode === "navigate" ? caches.match("/") : Response.error()))),
  );
});
