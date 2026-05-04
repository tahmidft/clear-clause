const KEY = "clearclause:prefs";
const THEME = "clearclause:theme";

export function getPrefs(): string[] {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
export function setPrefs(p: string[]) { localStorage.setItem(KEY, JSON.stringify(p)); }

export function getTheme(): "light" | "dark" {
  const saved = localStorage.getItem(THEME);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
export function applyTheme(t: "light" | "dark") {
  document.documentElement.classList.toggle("dark", t === "dark");
  localStorage.setItem(THEME, t);
}