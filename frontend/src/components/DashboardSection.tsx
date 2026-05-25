import type { ReactNode } from "react";
import type { ContractBucket } from "@/lib/contractBuckets";
import { BUCKET_DESCRIPTIONS, BUCKET_LABELS } from "@/lib/contractBuckets";

/* Using CSS variables so both light + dark themes resolve correctly */
const BUCKET_BADGE: Record<ContractBucket, { bg: string; border: string; color: string }> = {
  accept: {
    bg: "var(--cc-accept-bg)",
    border: "1px solid var(--cc-accept-border)",
    color: "var(--cc-accept-color)",
  },
  reject: {
    bg: "var(--cc-reject-bg)",
    border: "1px solid var(--cc-reject-border)",
    color: "var(--cc-reject-color)",
  },
  likely_scam: {
    bg: "var(--cc-scam-bg)",
    border: "1px solid var(--cc-scam-border)",
    color: "var(--cc-scam-color)",
  },
  analyzing: {
    bg: "rgba(0,122,255,0.08)",
    border: "1px solid rgba(0,122,255,0.18)",
    color: "var(--cc-accent)",
  },
  failed: {
    bg: "var(--cc-surface-2)",
    border: "1px solid var(--cc-card-border)",
    color: "var(--cc-muted)",
  },
  pending: {
    bg: "var(--cc-surface-2)",
    border: "1px solid var(--cc-card-border)",
    color: "var(--cc-muted)",
  },
};

interface DashboardSectionProps {
  bucket: ContractBucket;
  count: number;
  children: ReactNode;
}

export function DashboardSection({ bucket, count, children }: DashboardSectionProps) {
  if (count === 0) return null;

  const badge = BUCKET_BADGE[bucket];

  return (
    <section className="mb-8" aria-labelledby={`bucket-${bucket}`}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <span
            id={`bucket-${bucket}`}
            className="inline-flex items-center rounded-[20px] px-3 py-1"
            style={{
              fontSize: 12,
              fontWeight: 600,
              background: badge.bg,
              border: badge.border,
              color: badge.color,
              letterSpacing: "-0.01em",
            }}
          >
            {BUCKET_LABELS[bucket]}
            <span className="ml-1.5 tabular-nums opacity-70">({count})</span>
          </span>
          <p
            className="mt-1.5 text-[12px] leading-relaxed"
            style={{ color: "var(--cc-section-desc)" }}
          >
            {BUCKET_DESCRIPTIONS[bucket]}
          </p>
        </div>
      </div>
      <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
