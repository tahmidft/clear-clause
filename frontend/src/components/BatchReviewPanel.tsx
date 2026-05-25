import * as React from "react";
import { Link } from "react-router-dom";
import { ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalysisDetailView } from "@/components/AnalysisDetailView";
import { isLikelyScamAnalysis } from "@/lib/contractBuckets";
import { cn } from "@/lib/utils";
import type { Analysis, Contract } from "@/types";

export type BatchReviewItem = {
  contractId: string;
  fileName: string;
};

interface BatchReviewPanelProps {
  items: BatchReviewItem[];
  activeId: string;
  onActiveChange: (contractId: string) => void;
  onClose: () => void;
  contracts: Contract[];
  analyses: Record<string, Analysis | null>;
  errorIds: Set<string>;
}

function tabLabel(name: string, max = 28): string {
  if (name.length <= max) return name;
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
  const base = name.slice(0, max - ext.length - 1);
  return `${base}…${ext}`;
}

function TabBadge({ analysis, failed }: { analysis: Analysis | null | undefined; failed: boolean }) {
  if (failed) {
    return (
      <span className="ml-1.5 rounded-full bg-[var(--color-separator)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-secondary)]">
        Failed
      </span>
    );
  }
  if (!analysis) return null;
  if (isLikelyScamAnalysis(analysis)) {
    return (
      <span className="ml-1.5 rounded-full bg-[var(--color-red)]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-red)]">
        Scam
      </span>
    );
  }
  const accept = analysis.recommendation === "accept";
  return (
    <span
      className={cn(
        "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
        accept ? "bg-[var(--color-green)]/15 text-[var(--color-green)]" : "bg-[var(--color-red)]/15 text-[var(--color-red)]",
      )}
    >
      {analysis.overall_score}
    </span>
  );
}

export function BatchReviewPanel({
  items,
  activeId,
  onActiveChange,
  onClose,
  contracts,
  analyses,
  errorIds,
}: BatchReviewPanelProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const activeContract = contracts.find((c) => c.id === activeId);

  return (
    <div
      ref={panelRef}
      className="mb-10 min-w-0 overflow-hidden rounded-[12px] border border-[var(--color-blue)]/35 bg-[var(--color-surface)] shadow-[0_4px_24px_rgba(0,122,255,0.08)]"
    >
      <div className="flex flex-col gap-3 border-b border-[var(--color-separator)] px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="font-display text-xl font-semibold text-[var(--color-label)]">Batch review</h2>
          <p className="mt-1 text-[15px] text-[var(--color-secondary)]">
            Select a tab to compare {items.length} contracts from this upload. Nothing opens automatically.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {activeContract ? (
            <Button asChild variant="outline" size="sm" className="min-h-11 w-full rounded-[10px] sm:w-auto">
              <Link to={`/analysis/${activeId}`}>
                <ExternalLink className="mr-2 h-4 w-4" aria-hidden />
                Full page
              </Link>
            </Button>
          ) : null}
          <Button type="button" variant="ghost" size="sm" className="min-h-11 w-full rounded-[10px] sm:w-auto" onClick={onClose}>
            <X className="mr-2 h-4 w-4" aria-hidden />
            Done reviewing
          </Button>
        </div>
      </div>

      <Tabs value={activeId} onValueChange={onActiveChange} className="min-w-0 px-4 pb-6 pt-4 sm:px-6">
        <p className="mb-2 text-xs text-[var(--color-secondary)] lg:hidden">Swipe tabs to switch contracts</p>
        <div className="scroll-fade-x touch-scroll-x -mx-1">
          <TabsList className="flex h-auto w-max min-w-full justify-start gap-1 overflow-x-auto rounded-[10px] bg-[var(--color-bg)] p-1 sm:w-full">
            {items.map((item) => (
              <TabsTrigger
                key={item.contractId}
                value={item.contractId}
                className="min-h-11 shrink-0 rounded-[8px] px-3 py-2 text-[15px] data-[state=active]:bg-[var(--color-surface)] data-[state=active]:text-[var(--color-blue)] data-[state=active]:shadow-sm"
                title={item.fileName}
              >
                <span className="max-w-[10rem] truncate sm:max-w-[12rem]">{tabLabel(item.fileName)}</span>
                <TabBadge analysis={analyses[item.contractId]} failed={errorIds.has(item.contractId)} />
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {items.map((item) => {
          const contract = contracts.find((c) => c.id === item.contractId);
          if (!contract) return null;
          return (
            <TabsContent key={item.contractId} value={item.contractId} className="mt-6 focus-visible:outline-none">
              <AnalysisDetailView contract={contract} analysis={analyses[item.contractId]} compactTitle />
            </TabsContent>
          );
        })}
      </Tabs>

      {activeContract && errorIds.has(activeId) ? (
        <p className="px-6 pb-6 text-[17px] text-[var(--color-red)]" role="alert">
          Analysis failed for {activeContract.file_name}. Retry from the dashboard card below.
        </p>
      ) : null}
    </div>
  );
}
