import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyTheme, getTheme } from "./lib/preferences";

applyTheme(getTheme());
createRoot(document.getElementById("root")!).render(<App />);
