import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ChevronDown, ChevronRight, ArrowLeft, AlertOctagon, RotateCw, Bookmark, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SAMPLE_CONTRACTS, ContractSection, PREFERENCES } from "@/lib/mockData";
import { RiskBadge, ScoreBadge } from "@/components/RiskBadge";
import { getPrefs } from "@/lib/preferences";
import { cn } from "@/lib/utils";

export default function Analysis() {
  const { id } = useParams();
  const contract = SAMPLE_CONTRACTS.find((c) => c.id === id) ?? SAMPLE_CONTRACTS[0];
  const userPrefs = useMemo(() => {
    const saved = getPrefs();
    return saved.length ? saved : PREFERENCES.map((p) => p.key);
  }, []);
  const [openId, setOpenId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const conflicts = contract.sections.filter(
    (s) => s.conflictsWith?.some((k) => userPrefs.includes(k)),
  );
  const flagged = contract.sections.filter((s) => s.risk !== "safe");

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="h-10 rounded-full px-3">
          <Link to="/dashboard"><ArrowLeft className="mr-1 h-4 w-4" />Contracts</Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">{contract.name}</h1>
          <p className="mt-1 text-muted-foreground">
            {contract.client} ·{" "}
            {new Date(contract.date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <ScoreBadge score={contract.score} />
      </div>

      {/* iPad / mobile: open recommendation as bottom sheet */}
      <div className="mt-4 lg:hidden">
        <Button onClick={() => setSheetOpen(true)} className="h-11 w-full rounded-full">
          View recommendation
        </Button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <ul className="grid gap-3">
          {contract.sections.map((s) => (
            <SectionCard
              key={s.id}
              section={s}
              userPrefs={userPrefs}
              open={openId === s.id}
              onToggle={() => setOpenId(openId === s.id ? null : s.id)}
            />
          ))}
        </ul>

        <aside className="hidden lg:block">
          <RecommendationPanel contract={contract} flagged={flagged} conflicts={conflicts} />
        </aside>
      </div>

      {/* Bottom sheet (iPad / mobile) */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/40 lg:hidden"
          onClick={() => setSheetOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-elevated"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="mx-auto h-1.5 w-10 rounded-full bg-border" aria-hidden />
              <Button variant="ghost" size="icon" className="absolute right-4 top-4 h-11 w-11 rounded-full" onClick={() => setSheetOpen(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <RecommendationPanel contract={contract} flagged={flagged} conflicts={conflicts} />
          </div>
        </div>
      )}
    </div>
  );
}

function SectionCard({
  section, userPrefs, open, onToggle,
}: {
  section: ContractSection; userPrefs: string[]; open: boolean; onToggle: () => void;
}) {
  const conflicts = section.conflictsWith?.filter((k) => userPrefs.includes(k)) ?? [];
  return (
    <li>
      <div className={cn(
        "rounded-2xl border bg-surface shadow-card transition-colors",
        section.risk === "danger" ? "border-destructive/30" : "border-border",
      )}>
        <button
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-h-[64px] w-full items-start gap-4 p-5 text-left"
        >
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[17px] font-semibold tracking-tight">{section.title}</h3>
              <RiskBadge risk={section.risk} />
              {conflicts.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                  <AlertOctagon className="h-3.5 w-3.5" aria-hidden />
                  Conflicts your preferences
                </span>
              )}
            </div>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{section.summary}</p>
          </div>
          <span className="mt-1 text-muted-foreground" aria-hidden>
            {open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </span>
        </button>
        {open && (
          <div className="border-t border-border bg-background/40 px-5 py-4">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Original contract text
            </div>
            <p className="text-[15px] leading-relaxed">{section.original}</p>
            {conflicts.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-destructive">
                {conflicts.map((k) => {
                  const p = PREFERENCES.find((x) => x.key === k)!;
                  return <li key={k}>• Conflicts with: {p.label}</li>;
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

function RecommendationPanel({
  contract, flagged, conflicts,
}: {
  contract: typeof SAMPLE_CONTRACTS[number];
  flagged: ContractSection[];
  conflicts: ContractSection[];
}) {
  const verdict =
    contract.score >= 75 ? { label: "Accept", tone: "success" as const, reason: "Terms are reasonable and aligned with your preferences." } :
    contract.score >= 50 ? { label: "Negotiate", tone: "warning" as const, reason: "Some terms are workable but should be pushed back on." } :
    { label: "Reject or rewrite", tone: "destructive" as const, reason: "Several clauses conflict with your deal-breakers." };

  const toneCls =
    verdict.tone === "success" ? "bg-success text-success-foreground" :
    verdict.tone === "warning" ? "bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]" :
    "bg-destructive text-destructive-foreground";

  return (
    <div className="lg:sticky lg:top-20">
      <div className="rounded-3xl border border-border bg-surface p-6 shadow-card">
        <div className="text-sm font-medium text-muted-foreground">Recommendation</div>
        <div className="mt-3 flex items-baseline gap-3">
          <div className="text-5xl font-semibold tracking-tight">{contract.score}</div>
          <div className="text-sm text-muted-foreground">/ 100</div>
        </div>
        <div className={cn("mt-4 inline-flex rounded-full px-3 py-1.5 text-sm font-semibold", toneCls)}>
          {verdict.label}
        </div>
        <p className="mt-3 text-[15px] text-muted-foreground">{verdict.reason}</p>

        <div className="mt-6">
          <div className="text-sm font-medium">Flagged clauses</div>
          <ul className="mt-2 space-y-2">
            {flagged.length === 0 && <li className="text-sm text-muted-foreground">None — looks clean.</li>}
            {flagged.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 rounded-xl bg-secondary px-3 py-2 text-sm">
                <span>{s.title}</span>
                <RiskBadge risk={s.risk} />
              </li>
            ))}
          </ul>
        </div>

        {conflicts.length > 0 && (
          <div className="mt-6">
            <div className="text-sm font-medium">Preference conflicts</div>
            <ul className="mt-2 space-y-1 text-sm text-destructive">
              {conflicts.map((c) => (<li key={c.id}>• {c.title}</li>))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <Button className="h-11 rounded-full"><Bookmark className="mr-1.5 h-4 w-4" />Save analysis</Button>
          <Button variant="outline" className="h-11 rounded-full"><RotateCw className="mr-1.5 h-4 w-4" />Re-analyze</Button>
        </div>
      </div>
    </div>
  );
}