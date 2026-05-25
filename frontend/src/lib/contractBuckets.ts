import type { Analysis } from "@/types";

export type ContractBucket = "accept" | "reject" | "likely_scam" | "analyzing" | "failed" | "pending";

export function isLikelyScamAnalysis(analysis: Analysis | null | undefined): boolean {
  if (!analysis) return false;
  return Boolean(analysis.likely_scam || analysis.scam_risk !== "low");
}

export function contractBucket(
  analysis: Analysis | null | undefined,
  opts: { analyzing: boolean; failed: boolean },
): ContractBucket {
  if (opts.analyzing) return "analyzing";
  if (opts.failed) return "failed";
  if (!analysis) return "pending";
  if (isLikelyScamAnalysis(analysis)) return "likely_scam";
  return analysis.recommendation === "accept" ? "accept" : "reject";
}

export const BUCKET_ORDER: ContractBucket[] = ["analyzing", "accept", "reject", "pending", "failed", "likely_scam"];

export const BUCKET_LABELS: Record<ContractBucket, string> = {
  accept: "Accept",
  reject: "Reject",
  likely_scam: "Likely scam",
  analyzing: "Analyzing",
  failed: "Failed",
  pending: "Pending",
};

export const BUCKET_DESCRIPTIONS: Record<ContractBucket, string> = {
  accept: "Meets your preferences with no serious fraud signals.",
  reject: "Preference conflicts or risks — not classified as a scam.",
  likely_scam: "Fraud indicators detected — review signals on each card.",
  analyzing: "Analysis in progress.",
  failed: "Could not complete analysis.",
  pending: "Uploaded — analysis not started yet.",
};

export function findPaymentSection(analysis: Analysis) {
  return (
    analysis.sections.find((s) => /payment|compensation|fee|invoice|remuneration|deposit/i.test(s.title)) ?? null
  );
}
