// Bluestar Alliance Service Worker — v3

const CACHE_NAME = "bluestar-v3";
const STATIC_ASSETS = ["/", "/manifest.webmanifest", "/icons/icon-192x192.png", "/icons/icon-512x512.png"];

// ── Install ────────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
});

// ── Activate ───────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Fetch — network-first for API, cache-first for static assets ───────────────
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/") || url.hostname !== self.location.hostname) return;
  if (url.pathname.startsWith("/@") || url.pathname.startsWith("/src/")) return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok && res.type === "basic") {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request).then((r) => r || Response.error()))
  );
});

// ── Push Notification ──────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try { data = event.data.json(); }
  catch { data = { title: "Bluestar Alliance", body: event.data.text() }; }

  const title = data.title || "Bluestar Alliance";
  const options = {
    body: data.body || "You have a new notification.",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    tag: data.tag || "bluestar-notification",
    data: { url: data.url || "/dashboard" },
    vibrate: [200, 100, 200],
    actions: [
      { action: "open", title: "Open Portal" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification Click ─────────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Re-focus an existing tab if already open
      for (const client of windowClients) {
        const clientUrl = new URL(client.url);
        if (clientUrl.hostname === self.location.hostname) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Open a new tab
      return clients.openWindow(targetUrl);
    })
  );
});
