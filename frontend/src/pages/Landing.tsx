import { Link } from "react-router-dom";
import { Brain, CheckCircle2, Shield, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-label)]">
      <Navbar />
      <main>
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:pt-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-[34px] font-semibold leading-tight tracking-tight sm:text-[40px] lg:text-[44px]">
              Stop signing contracts you don&apos;t understand
            </h1>
            <p className="mt-6 text-[17px] leading-relaxed text-[var(--color-secondary)] sm:text-lg">
              ClearClause reads freelance agreements, flags risks in plain English, and compares every clause to your
              preferences so you can decide with confidence.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="min-h-12 min-w-[200px] rounded-[10px] text-[17px]" aria-label="Get started with ClearClause">
                <Link to="/signup">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="min-h-12 min-w-[200px] rounded-[10px] text-[17px]" aria-label="See how ClearClause works">
                <Link to="#how-it-works">See How It Works</Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-t border-[var(--color-separator)] bg-[var(--color-surface)] py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center font-display text-[28px] font-semibold sm:text-[34px]">How it works</h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                {
                  title: "Upload",
                  body: "Drop your PDF or Word contract. We extract the text securely.",
                  Icon: Upload,
                },
                {
                  title: "Analyze",
                  body: "Gemini maps each section to risk levels and your saved preferences.",
                  Icon: Brain,
                },
                {
                  title: "Decide",
                  body: "Get an accept or reject recommendation with clear reasoning.",
                  Icon: CheckCircle2,
                },
              ].map(({ title, body, Icon }) => (
                <Card
                  key={title}
                  className="rounded-[12px] border border-[var(--color-separator)] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-[var(--color-blue)]/12 text-[var(--color-blue)]">
                    <Icon className="h-6 w-6" aria-hidden />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
                  <p className="mt-2 text-[17px] text-[var(--color-secondary)]">{body}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center font-display text-[28px] font-semibold sm:text-[34px]">Built for freelancers</h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                {
                  title: "AI analysis",
                  body: "Complex clauses rewritten in everyday language you can skim in minutes.",
                  Icon: Sparkles,
                },
                {
                  title: "Risk flagging",
                  body: "Safe, caution, and red flag labels always pair with icons and explanations.",
                  Icon: Shield,
                },
                {
                  title: "Smart recommendations",
                  body: "A single score plus accept or reject guidance grounded in your preferences.",
                  Icon: CheckCircle2,
                },
              ].map(({ title, body, Icon }) => (
                <Card
                  key={title}
                  className="rounded-[12px] border border-[var(--color-separator)] bg-[var(--color-surface)] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)]"
                >
                  <Icon className="h-8 w-8 text-[var(--color-blue)]" aria-hidden />
                  <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
                  <p className="mt-2 text-[17px] text-[var(--color-secondary)]">{body}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-[var(--color-separator)] py-8 text-center text-sm text-[var(--color-secondary)]">
        <p>© {new Date().getFullYear()} ClearClause. AI-assisted analysis, not legal advice.</p>
      </footer>
    </div>
  );
}
