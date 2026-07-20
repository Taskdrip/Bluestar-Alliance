import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initAuth } from "./lib/auth";
import { registerServiceWorker } from "./lib/registerSW";

// Disable browser scroll restoration so our ScrollToTop component is always
// in control. Without this the browser restores the last scroll position on
// every hard refresh, landing users at the footer instead of the header.
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

initAuth();
registerServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
