import { AlertTriangle, CheckCircle2, XOctagon } from "lucide-react";
import { ScamAlert } from "@/components/ScamAlert";
import type { Analysis } from "@/types";
import { cn } from "@/lib/utils";

function scoreColor(score: number): string {
  if (score >= 70) return "var(--cc-green)";
  if (score >= 40) return "var(--cc-orange)";
  return "var(--cc-red)";
}

function ScoreRing({ score }: { score: number }) {
  const size = 120;
  const strokeW = 8;
  const r = (size - strokeW) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const offset = circumference * (1 - pct);
  const color = scoreColor(score);

  return (
    <div
      className="relative mx-auto flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={`Overall score ${score} out of 100`}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="var(--cc-ring-track)"
          strokeWidth={strokeW}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span
        className="absolute tabular-nums"
        style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em", color }}
      >
        {score}
      </span>
    </div>
  );
}

interface RecommendationPanelProps {
  analysis: Analysis;
  className?: string;
}

export function RecommendationPanel({ analysis, className }: RecommendationPanelProps) {
  const accept = analysis.recommendation === "accept";
  const RecIcon = accept ? CheckCircle2 : XOctagon;
  const recColor = accept ? "var(--cc-green)" : "var(--cc-red)";
  const recBg = accept ? "var(--cc-accept-bg)" : "var(--cc-reject-bg)";
  const recBorder = accept ? "1px solid var(--cc-accept-border)" : "1px solid var(--cc-reject-border)";

  return (
    <div
      className={cn(
        "rounded-[14px] p-5 sm:p-6 lg:sticky lg:top-[max(5.5rem,env(safe-area-inset-top,0px)+3.5rem)]",
        className,
      )}
      style={{
        background: "var(--cc-card-bg)",
        border: "0.5px solid var(--cc-card-border)",
      }}
    >
      <h2
        className="font-semibold tracking-tight"
        style={{ fontSize: 16, color: "var(--cc-title)" }}
      >
        Summary
      </h2>

      <ScamAlert
        className="mt-4"
        likelyScam={analysis.likely_scam}
        scamRisk={analysis.scam_risk}
        scamSignals={analysis.scam_signals}
      />

      <div className="mt-6 flex flex-col items-center gap-2">
        <ScoreRing score={analysis.overall_score} />
        <p className="text-[12px]" style={{ color: "var(--cc-muted)" }}>
          Overall contract score
        </p>
      </div>

      <div
        className="mt-5 flex min-h-10 items-center justify-center gap-2.5 rounded-[10px] px-4 py-2.5 text-center"
        style={{ background: recBg, border: recBorder }}
        role="status"
        aria-label={`Recommendation: ${accept ? "Accept" : "Reject"}`}
      >
        <RecIcon className="h-6 w-6 shrink-0" style={{ color: recColor }} aria-hidden />
        <span className="font-semibold tracking-tight" style={{ fontSize: 18, color: recColor }}>
          {accept ? "Accept" : "Reject"}
        </span>
      </div>

      <p className="mt-4 leading-relaxed" style={{ fontSize: 14, color: "var(--cc-muted)" }}>
        {analysis.recommendation_reason}
      </p>

      {analysis.preference_conflicts.length > 0 ? (
        <div className="mt-5 pt-5" style={{ borderTop: "0.5px solid var(--cc-divider)" }}>
          <h3
            className="flex items-center gap-2 font-semibold"
            style={{ fontSize: 14, color: "var(--cc-title)" }}
          >
            <AlertTriangle className="h-4 w-4" style={{ color: "var(--cc-orange)" }} aria-hidden />
            Preference conflicts
          </h3>
          <ul className="mt-3 space-y-2.5" role="list">
            {analysis.preference_conflicts.map((item) => (
              <li
                key={item}
                className="flex gap-2 text-[13px] leading-relaxed"
                style={{ color: "var(--cc-muted)" }}
              >
                <AlertTriangle
                  className="mt-0.5 h-3.5 w-3.5 shrink-0"
                  style={{ color: "var(--cc-orange)" }}
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
