import type { Section } from "@/types";

export type ClauseHighlightKind = "money" | "net_terms" | "days" | "percent" | "risky";

export interface ClauseSegment {
  text: string;
  kind?: ClauseHighlightKind;
}

interface Match {
  start: number;
  end: number;
  kind: ClauseHighlightKind;
}

const PATTERN_DEFS: { kind: ClauseHighlightKind; re: RegExp }[] = [
  {
    kind: "money",
    re: /\$[\d,]+(?:\.\d{2})?|\b[\d,]+(?:\.\d{2})?\s*(?:USD|dollars?)\b/gi,
  },
  { kind: "net_terms", re: /\bNET[\s-]*\d+\b/gi },
  {
    kind: "days",
    re: /\b\d{1,4}[\s-]*(?:business\s+)?days?\b|\b(?:within|after|before)\s+\d{1,4}\s+(?:calendar\s+)?days?\b/gi,
  },
  { kind: "percent", re: /\b\d{1,3}(?:\.\d+)?\s*%|\b\d{1,3}(?:\.\d+)?\s*percent\b/gi },
  {
    kind: "risky",
    re: /\b(?:indemnif(?:y|ication)|hold harmless|unlimited liability|sole discretion|irrevocable|perpetual|non-?refundable|waive(?:s|d)?|liquidated damages|assign(?:ment)? without consent|work(?:s)? for hire|exclusive rights|terminate(?:d)? (?:at any time|without cause)|no oral modifications?)\b/gi,
  },
];

const KIND_PRIORITY: Record<ClauseHighlightKind, number> = {
  risky: 0,
  money: 1,
  net_terms: 2,
  days: 3,
  percent: 4,
};

function collectMatches(text: string): Match[] {
  const matches: Match[] = [];
  for (const { kind, re } of PATTERN_DEFS) {
    const pattern = new RegExp(re.source, re.flags);
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(text)) !== null) {
      matches.push({ start: m.index, end: m.index + m[0].length, kind });
    }
  }
  return matches;
}

function pickNonOverlapping(matches: Match[]): Match[] {
  const sorted = [...matches].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    const lenA = a.end - a.start;
    const lenB = b.end - b.start;
    if (lenA !== lenB) return lenB - lenA;
    return KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind];
  });

  const chosen: Match[] = [];
  let cursor = 0;
  for (const match of sorted) {
    if (match.start < cursor) continue;
    chosen.push(match);
    cursor = match.end;
  }
  return chosen.sort((a, b) => a.start - b.start);
}

/** Split clause text into plain and highlighted segments for rendering. */
export function splitClauseText(text: string): ClauseSegment[] {
  if (!text) return [];

  const chosen = pickNonOverlapping(collectMatches(text));
  if (chosen.length === 0) return [{ text }];

  const segments: ClauseSegment[] = [];
  let pos = 0;
  for (const { start, end, kind } of chosen) {
    if (start > pos) segments.push({ text: text.slice(pos, start) });
    segments.push({ text: text.slice(start, end), kind });
    pos = end;
  }
  if (pos < text.length) segments.push({ text: text.slice(pos) });
  return segments;
}

const HIGHLIGHT_BASE =
  "rounded-[4px] px-0.5 font-semibold decoration-clone box-decoration-clone";

export function highlightClassFor(kind: ClauseHighlightKind, riskLevel?: Section["risk_level"]): string {
  switch (kind) {
    case "money":
      return `${HIGHLIGHT_BASE} bg-[color-mix(in_srgb,var(--cc-accent)_14%,transparent)] text-[var(--cc-clause-color)]`;
    case "net_terms":
      return `${HIGHLIGHT_BASE} bg-[color-mix(in_srgb,var(--cc-accent)_10%,transparent)] text-[var(--cc-clause-color)]`;
    case "days":
      return `${HIGHLIGHT_BASE} bg-[color-mix(in_srgb,var(--cc-green)_12%,transparent)] text-[var(--cc-clause-color)]`;
    case "percent":
      return `${HIGHLIGHT_BASE} bg-[color-mix(in_srgb,var(--cc-orange)_18%,transparent)] text-[var(--cc-clause-color)]`;
    case "risky":
      if (riskLevel === "red_flag") {
        return `${HIGHLIGHT_BASE} bg-[color-mix(in_srgb,var(--cc-red)_16%,transparent)] text-[var(--cc-clause-color)]`;
      }
      if (riskLevel === "caution") {
        return `${HIGHLIGHT_BASE} bg-[color-mix(in_srgb,var(--cc-orange)_20%,transparent)] text-[var(--cc-clause-color)]`;
      }
      return `${HIGHLIGHT_BASE} bg-[color-mix(in_srgb,var(--cc-muted)_25%,transparent)] text-[var(--cc-clause-color)]`;
    default:
      return `${HIGHLIGHT_BASE} text-[var(--cc-clause-color)]`;
  }
}
