import { AlertTriangle } from "lucide-react";
import { RiskBadge } from "@/components/RiskBadge";
import { ClauseExcerpt } from "@/components/ClauseExcerpt";
import type { Section } from "@/types";

interface SectionCardProps {
  section: Section;
}

export function SectionCard({ section }: SectionCardProps) {
  return (
    <div
      className="rounded-[14px] p-5"
      style={{
        background: "var(--cc-card-bg)",
        border: "0.5px solid var(--cc-card-border)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3
          className="text-[15px] font-semibold leading-snug"
          style={{ color: "var(--cc-title)", letterSpacing: "-0.01em" }}
        >
          {section.title}
        </h3>
        <RiskBadge level={section.risk_level} />
      </div>

      <p
        className="mt-3 text-[16px] leading-relaxed"
        style={{ color: "var(--cc-body)" }}
      >
        {section.plain_english}
      </p>

      {section.risk_reason?.trim() && section.risk_reason.trim() !== "Not specified" ? (
        <p className="mt-2 text-[14px] leading-relaxed" style={{ color: "var(--cc-muted)" }}>
          <span className="font-medium" style={{ color: "var(--cc-title)" }}>
            Why this rating:{" "}
          </span>
          {section.risk_reason}
        </p>
      ) : null}

      {section.conflicts_with_preference ? (
        <div
          className="mt-3 flex items-start gap-2 rounded-[8px] px-3 py-2.5"
          style={{
            background: "var(--cc-scam-bg)",
            border: "0.5px solid var(--cc-scam-border)",
          }}
          role="alert"
        >
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0"
            style={{ color: "var(--cc-orange)" }}
            aria-hidden
          />
          <p className="text-[13px]" style={{ color: "var(--cc-body)" }}>
            This conflicts with your stated preferences.
          </p>
        </div>
      ) : null}

      <ClauseExcerpt
        text={section.original_text}
        riskLevel={section.risk_level}
        className="mt-4"
      />
    </div>
  );
}
