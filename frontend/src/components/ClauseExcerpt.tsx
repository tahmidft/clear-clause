import type { Section } from "@/types";
import { isMeaningfulClauseText } from "@/lib/clauseText";
import { highlightClassFor, splitClauseText } from "@/lib/highlightClause";
import { cn } from "@/lib/utils";

interface ClauseExcerptProps {
  text: string;
  riskLevel?: Section["risk_level"];
  label?: string;
  className?: string;
}

export function ClauseExcerpt({ text, riskLevel, label = "Original clause", className }: ClauseExcerptProps) {
  if (!isMeaningfulClauseText(text)) return null;

  const segments = splitClauseText(text);

  return (
    <div
      className={cn("pt-4", className)}
      style={{ borderTop: "0.5px solid var(--cc-divider)" }}
    >
      <p
        className="text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: "var(--cc-subtle)" }}
      >
        {label}
      </p>
      <p
        className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded-[10px] px-4 py-3 text-[16px] leading-[1.65] tracking-[0.01em]"
        style={{
          border: "0.5px solid var(--cc-clause-border)",
          background: "var(--cc-clause-bg)",
          color: "var(--cc-clause-color)",
        }}
        lang="en"
      >
        {segments.map((seg, i) =>
          seg.kind ? (
            <mark
              key={`${i}-${seg.text.slice(0, 12)}`}
              className={highlightClassFor(seg.kind, riskLevel)}
            >
              {seg.text}
            </mark>
          ) : (
            <span key={`${i}-${seg.text.slice(0, 12)}`}>{seg.text}</span>
          ),
        )}
      </p>
    </div>
  );
}
