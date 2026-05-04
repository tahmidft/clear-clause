import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PREFERENCES, riskCopy } from "@/lib/mockData";
import { setPrefs } from "@/lib/preferences";
import { cn } from "@/lib/utils";

const stepGroups = [
  { title: "What matters most?", desc: "Pick the deal-breakers ClearClause should flag in every contract.", keys: ["unpaid_revisions", "late_payment"] },
  { title: "Protect your work", desc: "Choose how strict you want to be about IP and exclusivity.", keys: ["ip_ownership", "non_compete"] },
  { title: "Know your exit", desc: "Set the minimum termination notice you'll accept.", keys: ["termination_notice"] },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>(PREFERENCES.map((p) => p.key));
  const nav = useNavigate();
  const group = stepGroups[step];
  const total = stepGroups.length;
  const progress = useMemo(() => ((step + 1) / total) * 100, [step]);

  const toggle = (k: string) =>
    setSelected((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));

  const next = () => {
    if (step < total - 1) setStep(step + 1);
    else {
      setPrefs(selected);
      nav("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="glass sticky top-0 z-40 border-b border-border">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4 md:px-8">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
          <span className="font-semibold tracking-tight">ClearClause</span>
          <div className="ml-auto text-sm text-muted-foreground">Step {step + 1} of {total}</div>
        </div>
        <div className="h-1 w-full bg-secondary">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} aria-hidden />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-16">
        <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">{group.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{group.desc}</p>

        <div className="mt-8 grid gap-3">
          {group.keys.map((k) => {
            const pref = PREFERENCES.find((p) => p.key === k)!;
            const on = selected.includes(k);
            return (
              <button
                key={k}
                onClick={() => toggle(k)}
                aria-pressed={on}
                className={cn(
                  "flex min-h-[64px] w-full items-center gap-4 rounded-2xl border p-5 text-left transition-all",
                  on
                    ? "border-primary bg-accent shadow-card"
                    : "border-border bg-surface hover:border-primary/40",
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-border",
                  )}
                  aria-hidden
                >
                  {on && <Check className="h-4 w-4" />}
                </div>
                <div>
                  <div className="text-[17px] font-medium">{pref.label}</div>
                  <div className="text-[15px] text-muted-foreground">{pref.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => (step === 0 ? nav("/") : setStep(step - 1))}
            className="h-11 rounded-full px-5"
          >
            Back
          </Button>
          <Button onClick={next} className="h-11 rounded-full px-6">
            {step === total - 1 ? "Finish" : "Continue"}
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}