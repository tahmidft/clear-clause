import { Link } from "react-router-dom";
import { ArrowRight, Upload, Sparkles, ShieldCheck, FileSearch, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  { icon: Upload, title: "Upload your contract", desc: "Drag in any PDF or DOCX. We never share your files." },
  { icon: FileSearch, title: "AI reads every clause", desc: "Plain‑English summaries for payment, IP, termination and more." },
  { icon: Scale, title: "Decide with confidence", desc: "See red flags against your personal deal‑breakers and accept or push back." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="glass sticky top-0 z-40 border-b border-border">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-8">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
            ClearClause
          </Link>
          <Button asChild size="sm" className="h-10 rounded-full px-4">
            <Link to="/onboarding">Get started <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 pb-16 pt-16 text-center md:px-8 md:pt-28">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-sm text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
          AI contract review for freelancers
        </div>
        <h1 className="text-balance text-5xl font-semibold tracking-tight md:text-7xl">
          Sign smarter.<br />
          <span className="text-muted-foreground">Never miss a red flag again.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          ClearClause reads freelance contracts the way a senior lawyer would — flagging unpaid revisions,
          NET‑90 traps, IP grabs and non‑competes against the deal‑breakers you set.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="h-12 rounded-full px-6 text-base">
            <Link to="/onboarding">Analyze a contract <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-6 text-base">
            <Link to="/dashboard">See a live demo</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 md:px-8" aria-labelledby="how">
        <h2 id="how" className="mb-10 text-center text-3xl font-semibold tracking-tight md:text-4xl">
          How it works
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="rounded-3xl border border-border bg-surface p-7 shadow-card"
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <s.icon className="h-5 w-5" aria-hidden />
              </div>
              <div className="mb-1 text-sm font-medium text-muted-foreground">Step {i + 1}</div>
              <h3 className="text-xl font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-[15px] text-muted-foreground">{s.desc}</p>
            </li>
          ))}
        </ol>

        <div className="mt-16 rounded-3xl border border-border bg-gradient-to-br from-accent to-surface p-10 text-center shadow-card md:p-14">
          <h3 className="text-3xl font-semibold tracking-tight md:text-4xl">Ready in under a minute.</h3>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Set your deal‑breakers once. Drop in a contract. Get a verdict you can act on.
          </p>
          <Button asChild size="lg" className="mt-6 h-12 rounded-full px-6 text-base">
            <Link to="/onboarding">Start free</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © 2026 ClearClause. Not a substitute for legal advice.
      </footer>
    </div>
  );
}