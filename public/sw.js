// NutriFlow Service Worker — offline shell caching + network-first API strategy
const VERSION = "v1.0.0";
const SHELL_CACHE = `nutriflow-shell-${VERSION}`;
const RUNTIME_CACHE = `nutriflow-runtime-${VERSION}`;

const SHELL_ASSETS = ["/", "/manifest.json", "/icon-192.svg", "/icon-512.svg", "/favicon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Only handle GET
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache auth or mutation endpoints — always go to network
  if (url.pathname.startsWith("/api/auth") || url.pathname.startsWith("/api/")) {
    // Network-first for API; fall back to nothing (do not cache user data)
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: "Offline" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    return;
  }

  // For navigation requests: network-first, fall back to cached shell
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/"))),
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok && url.origin === self.location.origin) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
