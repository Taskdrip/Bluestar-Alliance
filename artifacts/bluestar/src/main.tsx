import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initAuth } from "./lib/auth";
import { registerServiceWorker } from "./lib/registerSW";

initAuth();
registerServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
