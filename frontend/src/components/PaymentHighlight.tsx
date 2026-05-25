import { Banknote } from "lucide-react";
import { RiskBadge } from "@/components/RiskBadge";
import { ClauseExcerpt } from "@/components/ClauseExcerpt";
import type { Section } from "@/types";

interface PaymentHighlightProps {
  section: Section;
}

export function PaymentHighlight({ section }: PaymentHighlightProps) {
  return (
    <div
      className="rounded-[14px] p-5 sm:p-6"
      style={{
        background: "var(--cc-card-bg)",
        border: "0.5px solid var(--cc-zone-border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Banknote className="h-6 w-6 shrink-0" style={{ color: "var(--cc-accent)" }} aria-hidden />
          <h2
            className="font-semibold tracking-tight"
            style={{ fontSize: 18, color: "var(--cc-title)", letterSpacing: "-0.02em" }}
          >
            Payment terms
          </h2>
        </div>
        <RiskBadge level={section.risk_level} />
      </div>

      <p className="mt-4 text-[16px] leading-relaxed" style={{ color: "var(--cc-body)" }}>
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
        <p className="mt-3 text-[14px] font-medium" style={{ color: "var(--cc-orange)" }}>
          Conflicts with your payment preferences.
        </p>
      ) : null}

      <ClauseExcerpt
        text={section.original_text}
        riskLevel={section.risk_level}
        label="Payment clause from contract"
        className="mt-4"
      />
    </div>
  );
}
