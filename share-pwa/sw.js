// Recipe Box share PWA — minimal service worker.
// Required for PWA installability (Chrome looks for a registered SW with
// a fetch handler). We don't actually cache anything — the PWA is
// online-only and the page is tiny.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Pass-through fetch handler. Its presence (not its behavior) is what
// makes Chrome consider the PWA installable.
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
