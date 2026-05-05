import { AlertTriangle, CheckCircle2, XOctagon } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Analysis } from "@/types";
import { cn } from "@/lib/utils";

function scoreColor(score: number): string {
  if (score > 70) return "var(--color-green)";
  if (score >= 40) return "var(--color-yellow)";
  return "var(--color-red)";
}

function ScoreRing({ score }: { score: number }) {
  const size = 120;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const dash = c * (1 - pct);
  const color = scoreColor(score);

  return (
    <div className="relative mx-auto flex h-[120px] w-[120px] items-center justify-center" aria-label={`Overall score ${score} out of 100`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-separator)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={dash}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute font-display text-[34px] font-semibold tabular-nums text-[var(--color-label)]">
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

  return (
    <Card
      className={cn(
        "rounded-[12px] border border-[var(--color-separator)] bg-[var(--color-surface)] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] lg:sticky lg:top-24 dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)]",
        className,
      )}
    >
      <h2 className="font-display text-xl font-semibold text-[var(--color-label)]">Summary</h2>
      <div className="mt-6 flex flex-col items-center gap-2">
        <ScoreRing score={analysis.overall_score} />
        <p className="text-sm text-[var(--color-secondary)]">Overall contract score</p>
      </div>
      <div
        className={cn(
          "mt-8 flex min-h-[44px] items-center justify-center gap-3 rounded-[10px] border px-4 py-3 text-center font-display text-2xl font-semibold",
          accept
            ? "border-[var(--color-green)]/40 bg-[var(--color-green)]/12 text-[var(--color-green)]"
            : "border-[var(--color-red)]/40 bg-[var(--color-red)]/12 text-[var(--color-red)]",
        )}
        role="status"
        aria-label={`Recommendation: ${accept ? "Accept" : "Reject"}`}
      >
        <RecIcon className="h-8 w-8 shrink-0" aria-hidden />
        <span>{accept ? "Accept" : "Reject"}</span>
      </div>
      <p className="mt-6 text-[17px] leading-relaxed text-[var(--color-secondary)]">{analysis.recommendation_reason}</p>
      {analysis.preference_conflicts.length > 0 ? (
        <div className="mt-6 border-t border-[var(--color-separator)] pt-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-label)]">
            <AlertTriangle className="h-5 w-5 text-[var(--color-yellow)]" aria-hidden />
            Preference conflicts
          </h3>
          <ul className="mt-3 space-y-3" role="list">
            {analysis.preference_conflicts.map((item) => (
              <li key={item} className="flex gap-2 text-[17px] text-[var(--color-secondary)]">
                <AlertTriangle className="mt-1 h-4 w-4 shrink-0 text-[var(--color-yellow)]" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
