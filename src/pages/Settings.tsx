import { useEffect, useState } from "react";
import { Moon, Sun, User } from "lucide-react";
import { PREFERENCES } from "@/lib/mockData";
import { applyTheme, getPrefs, getTheme, setPrefs } from "@/lib/preferences";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export default function Settings() {
  const [selected, setSelected] = useState<string[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = getPrefs();
    setSelected(saved.length ? saved : PREFERENCES.map((p) => p.key));
    setTheme(getTheme());
  }, []);

  const toggle = (k: string) => {
    const next = selected.includes(k) ? selected.filter((x) => x !== k) : [...selected, k];
    setSelected(next);
    setPrefs(next);
  };

  const switchTheme = (next: "light" | "dark") => {
    setTheme(next);
    applyTheme(next);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Settings</h1>
      <p className="mt-2 text-lg text-muted-foreground">Tune your deal‑breakers and appearance.</p>

      <section className="mt-8 rounded-3xl border border-border bg-surface p-6 shadow-card">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <User className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <div className="text-[17px] font-semibold">Demo account</div>
            <div className="text-sm text-muted-foreground">freelancer@clearclause.app</div>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-border bg-surface p-6 shadow-card">
        <h2 className="text-xl font-semibold tracking-tight">Appearance</h2>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              onClick={() => switchTheme(t)}
              aria-pressed={theme === t}
              className={cn(
                "flex min-h-[64px] items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
                theme === t ? "border-primary bg-accent" : "border-border hover:border-primary/40",
              )}
            >
              {t === "light" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="text-[17px] font-medium capitalize">{t} mode</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-border bg-surface p-6 shadow-card">
        <h2 className="text-xl font-semibold tracking-tight">Deal‑breakers</h2>
        <p className="mt-1 text-muted-foreground">ClearClause flags any clause that conflicts with these.</p>
        <ul className="mt-4 divide-y divide-border">
          {PREFERENCES.map((p) => {
            const on = selected.includes(p.key);
            return (
              <li key={p.key} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <div className="text-[17px] font-medium">{p.label}</div>
                  <div className="text-sm text-muted-foreground">{p.desc}</div>
                </div>
                <Switch checked={on} onCheckedChange={() => toggle(p.key)} aria-label={p.label} />
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}