import { Link } from "react-router-dom";
import { Brain, CheckCircle2, Shield, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandIcon } from "@/components/BrandLogo";

function Navbar() {
  return (
    <header
      className="safe-top sticky top-0 z-50"
      style={{
        background: "var(--cc-sidebar-bg)",
        borderBottom: "0.5px solid var(--cc-sidebar-border)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
      }}
      role="banner"
    >
      <div className="mx-auto flex h-[52px] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-accent)]"
          aria-label="ClearClause home"
        >
          <BrandIcon size={28} className="shrink-0" />
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--cc-title)" }}>
            ClearClause
          </span>
        </Link>
        <nav className="flex items-center gap-2" aria-label="Primary">
          <Button asChild size="sm" className="rounded-[8px]">
            <Link to="/login">Sign In</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen" style={{ background: "var(--cc-bg)", color: "var(--cc-title)" }}>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24 lg:pt-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1
              style={{
                fontSize: "clamp(28px, 5vw, 42px)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
                color: "var(--cc-title)",
              }}
            >
              Stop signing contracts you don&apos;t understand
            </h1>
            <p
              className="leading-relaxed"
              style={{ fontSize: 16, color: "var(--cc-muted)", maxWidth: 540, margin: "20px auto 0" }}
            >
              ClearClause reads freelance agreements, flags risks in plain English, and compares every clause to your
              preferences so you can decide with confidence.
            </p>
            <div className="mt-10 flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                className="w-full rounded-[12px] sm:w-auto"
                style={{ fontWeight: 590 }}
                aria-label="Get started with ClearClause"
              >
                <Link to="/signup">Get Started</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full rounded-[12px] sm:w-auto"
                aria-label="See how ClearClause works"
              >
                <a href="#how-it-works">See How It Works</a>
              </Button>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="py-14 sm:py-20"
          style={{
            borderTop: "0.5px solid var(--cc-divider)",
            background: "var(--cc-surface-2)",
          }}
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2
              className="text-center"
              style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--cc-title)" }}
            >
              How it works
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-5 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {[
                { title: "Upload", body: "Drop your PDF or Word contract. We extract the text securely.", Icon: Upload },
                { title: "Analyze", body: "Our AI maps each section to risk levels and your saved preferences.", Icon: Brain },
                { title: "Decide", body: "Get an accept or reject recommendation with clear reasoning.", Icon: CheckCircle2 },
              ].map(({ title, body, Icon }) => (
                <div
                  key={title}
                  className="rounded-[14px] p-5 sm:p-6"
                  style={{ background: "var(--cc-card-bg)", border: "0.5px solid var(--cc-card-border)" }}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-[10px]"
                    style={{ background: "var(--cc-zone-bg)", border: "0.5px solid var(--cc-zone-border)" }}
                  >
                    <Icon className="h-5 w-5" style={{ color: "var(--cc-accent)" }} aria-hidden />
                  </div>
                  <h3 className="mt-4 font-semibold tracking-tight" style={{ fontSize: 16, color: "var(--cc-title)" }}>
                    {title}
                  </h3>
                  <p className="mt-2 leading-relaxed" style={{ fontSize: 14, color: "var(--cc-muted)" }}>
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2
              className="text-center"
              style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--cc-title)" }}
            >
              Built for freelancers
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-5 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {[
                { title: "AI analysis", body: "Complex clauses rewritten in everyday language you can skim in minutes.", Icon: Sparkles },
                { title: "Risk flagging", body: "Safe, caution, and red flag labels always pair with icons and explanations.", Icon: Shield },
                { title: "Smart recommendations", body: "A single score plus accept or reject guidance grounded in your preferences.", Icon: CheckCircle2 },
              ].map(({ title, body, Icon }) => (
                <div
                  key={title}
                  className="rounded-[14px] p-5 sm:p-6"
                  style={{ background: "var(--cc-card-bg)", border: "0.5px solid var(--cc-card-border)" }}
                >
                  <Icon className="h-7 w-7" style={{ color: "var(--cc-accent)" }} aria-hidden />
                  <h3 className="mt-4 font-semibold" style={{ fontSize: 16, color: "var(--cc-title)" }}>{title}</h3>
                  <p className="mt-2 leading-relaxed" style={{ fontSize: 14, color: "var(--cc-muted)" }}>{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer
        className="safe-bottom py-8 text-center text-[12px]"
        style={{
          borderTop: "0.5px solid var(--cc-divider)",
          color: "var(--cc-subtle)",
          paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
        }}
      >
        <p>© {new Date().getFullYear()} ClearClause. AI-assisted analysis, not legal advice.</p>
      </footer>
    </div>
  );
}
