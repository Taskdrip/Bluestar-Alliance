/**
 * Registers the Bluestar Alliance service worker.
 * Also auto-subscribes authenticated users to web push notifications
 * so they receive real-time alerts from HR on every device they log in from.
 */
export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
      console.log("[SW] Registered:", reg.scope);

      // Check for updates
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New version available — activate immediately
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        }
      });

      // Auto-subscribe to push if the user is logged in and hasn't subscribed yet
      await autoSubscribePush(reg);
    } catch (err) {
      console.warn("[SW] Registration failed:", err);
    }
  });

  // When a new SW takes over, reload once so the user gets the fresh version
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!refreshing) { refreshing = true; window.location.reload(); }
  });
}

async function autoSubscribePush(reg: ServiceWorkerRegistration) {
  if (!("PushManager" in window) || !("Notification" in window)) return;

  const token = localStorage.getItem("bluestar_token");
  if (!token) return; // Not logged in — nothing to subscribe

  // If already subscribed, we're good
  const existing = await reg.pushManager.getSubscription().catch(() => null);
  if (existing) return;

  // Only auto-subscribe if the user has already granted permission or we're prompting
  // We do NOT prompt here — that happens when the user actively enables notifications.
  // This just re-subscribes on new devices if permission was already granted.
  if (Notification.permission !== "granted") return;

  try {
    const keyRes = await fetch("/api/push/vapid-public-key");
    if (!keyRes.ok) return;
    const { publicKey } = await keyRes.json();

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    // Get user email from the token payload
    let email = "";
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      email = payload.email || payload.sub || "";
    } catch { return; }

    if (!email) return;

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...sub.toJSON(), email }),
    });

    console.log("[Push] Auto-subscribed on this device.");
  } catch (err) {
    console.warn("[Push] Auto-subscribe failed:", err);
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}
