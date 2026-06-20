import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// One-time programmatic clear to wipe all old logged browser data/history
if (!localStorage.getItem("paisa.cleared.v2")) {
  localStorage.clear();
  localStorage.setItem("paisa.cleared.v2", "true");
}

createRoot(document.getElementById("root")!).render(<App />);
