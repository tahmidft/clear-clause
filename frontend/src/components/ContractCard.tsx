import * as React from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { AlertTriangle, ShieldAlert, Trash2 } from "lucide-react";
import { ScamAlert } from "@/components/ScamAlert";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AnalysisProgress } from "@/components/AnalysisProgress";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { isLikelyScamAnalysis } from "@/lib/contractBuckets";
import type { Analysis, Contract } from "@/types";

interface ContractCardProps {
  contract: Contract;
  analysis: Analysis | null | undefined;
  isAnalyzing: boolean;
  isFinishing?: boolean;
  batchMode?: boolean;
  analysisError: boolean;
  onDelete: () => void;
  onRetryAnalysis: () => void;
}

/** Returns the fill color for the score ring based on the score value */
function scoreRingColor(score: number): string {
  if (score >= 70) return "var(--cc-green)";
  if (score >= 40) return "var(--cc-orange)";
  return "var(--cc-red)";
}

function MiniScoreRing({ score }: { score: number }) {
  const size = 52;
  const strokeW = 4;
  const r = (size - strokeW) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const offset = circumference * (1 - pct);
  const color = scoreRingColor(score);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-hidden>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
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
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center tabular-nums"
        style={{ fontSize: 13, fontWeight: 700, color }}
      >
        {score}
      </span>
    </div>
  );
}

export function ContractCard({
  contract,
  analysis,
  isAnalyzing,
  isFinishing = false,
  batchMode = false,
  analysisError,
  onDelete,
  onRetryAnalysis,
}: ContractCardProps) {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const score = analysis?.overall_score ?? null;
  const accept = analysis?.recommendation === "accept";
  const scamFlag = isLikelyScamAnalysis(analysis);
  const showScamAlert = scamFlag && !isAnalyzing && !isFinishing && analysis;

  const statusLabel = isFinishing
    ? batchMode ? "Scoring" : "Complete"
    : isAnalyzing ? "Analyzing"
    : analysisError ? "Failed"
    : analysis
      ? scamFlag ? "Likely scam" : accept ? "Accept" : "Reject"
      : "Pending";

  /* Badge colours derived from bucket */
  const badgeBg = scamFlag && !isAnalyzing && !isFinishing
    ? "var(--cc-scam-bg)"
    : accept && analysis && !scamFlag
      ? "var(--cc-accept-bg)"
      : analysis && !scamFlag
        ? "var(--cc-reject-bg)"
        : "var(--cc-surface-2)";

  const badgeBorder = scamFlag && !isAnalyzing && !isFinishing
    ? "1px solid var(--cc-scam-border)"
    : accept && analysis && !scamFlag
      ? "1px solid var(--cc-accept-border)"
      : analysis && !scamFlag
        ? "1px solid var(--cc-reject-border)"
        : "1px solid var(--cc-card-border)";

  const badgeColor = scamFlag && !isAnalyzing && !isFinishing
    ? "var(--cc-scam-color)"
    : accept && analysis && !scamFlag
      ? "var(--cc-accept-color)"
      : analysis && !scamFlag
        ? "var(--cc-reject-color)"
        : "var(--cc-muted)";

  const deleteControls = (
    <>
      {!isMobile ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-red)]"
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--cc-red)", opacity: 0.5, transition: "opacity 0.2s ease, background 0.2s ease" }}
              onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.opacity = "1"; el.style.background = "rgba(255,59,48,0.08)"; }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.opacity = "0.5"; el.style.background = "transparent"; }}
              aria-label={`Delete contract ${contract.file_name}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent
            className="rounded-[14px]"
            style={{ background: "var(--cc-modal-bg)", border: "0.5px solid var(--cc-modal-border)" }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle style={{ color: "var(--cc-title)" }}>Delete this contract?</AlertDialogTitle>
              <AlertDialogDescription style={{ color: "var(--cc-muted)" }}>
                This removes the file and its analysis from your account. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-[10px]">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="rounded-[10px]"
                style={{ background: "var(--cc-red)" }}
                onClick={onDelete}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] outline-none"
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--cc-red)", opacity: 0.5 }}
              aria-label={`Delete contract ${contract.file_name}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </SheetTrigger>
          <SheetContent
            side="bottom"
            className="rounded-t-[16px]"
            style={{ background: "var(--cc-modal-bg)", border: "0.5px solid var(--cc-modal-border)" }}
            aria-describedby={undefined}
          >
            <SheetHeader>
              <SheetTitle style={{ color: "var(--cc-title)" }}>Delete this contract?</SheetTitle>
            </SheetHeader>
            <p className="px-4 pb-4 text-[14px]" style={{ color: "var(--cc-muted)" }}>
              This removes the file and its analysis. This cannot be undone.
            </p>
            <SheetFooter className="flex-col gap-2 sm:flex-col">
              <Button type="button" variant="destructive" className="w-full rounded-[10px]" onClick={() => { setSheetOpen(false); onDelete(); }}>
                Delete contract
              </Button>
              <Button type="button" variant="outline" className="w-full rounded-[10px]" onClick={() => setSheetOpen(false)}>
                Cancel
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}
    </>
  );

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 flex-col overflow-hidden rounded-[14px]",
        !(scamFlag && !isAnalyzing && !isFinishing) && "card-interactive",
      )}
      style={{
        background: "var(--cc-card-bg)",
        border: scamFlag && !isAnalyzing && !isFinishing
          ? "0.5px solid var(--cc-scam-border)"
          : "0.5px solid var(--cc-card-border)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
      }}
    >
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <Link
            to={`/analysis/${contract.id}`}
            className="min-h-[44px] min-w-0 flex-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-accent)]"
            aria-label={`Open analysis for ${contract.file_name}`}
          >
            <h3
              className="line-clamp-2 leading-snug"
              style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--cc-body)" }}
            >
              {contract.file_name}
            </h3>
            <p className="mt-1" style={{ fontSize: 11, color: "var(--cc-subtle)" }}>
              Uploaded {format(new Date(contract.created_at), "MMM d, yyyy")}
            </p>
          </Link>
          {deleteControls}
        </div>

        {/* Status badge */}
        <div
          className="inline-flex max-w-fit items-center gap-1.5 rounded-full px-3 py-1"
          style={{ fontSize: 12, fontWeight: 600, background: badgeBg, border: badgeBorder, color: badgeColor }}
        >
          {scamFlag && !isAnalyzing && !isFinishing ? <ShieldAlert className="h-3.5 w-3.5" aria-hidden /> : null}
          {statusLabel}
        </div>

        {/* Score / progress body */}
        <div className="flex flex-1 flex-col justify-end">
          {isAnalyzing || isFinishing ? (
            <AnalysisProgress
              running={isAnalyzing && !isFinishing}
              finishing={isFinishing}
              variant="compact"
              title={contract.file_name}
            />
          ) : analysisError ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2" style={{ color: "var(--cc-red)" }} role="alert">
                <AlertTriangle className="h-5 w-5" aria-hidden />
                <span className="text-[14px]">Analysis failed</span>
              </div>
              <Button type="button" variant="secondary" className="rounded-[10px]" onClick={onRetryAnalysis}>
                Retry
              </Button>
            </div>
          ) : score != null ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <MiniScoreRing score={score} />
                {!scamFlag ? (
                  <div className="flex items-center gap-1.5">
                    <span
                      className="inline-block rounded-full"
                      style={{ width: 6, height: 6, background: scoreRingColor(score), flexShrink: 0 }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 500, color: scoreRingColor(score) }}>
                      {accept ? "Accept" : "Reject"}
                    </span>
                  </div>
                ) : null}
              </div>
              {showScamAlert ? (
                <ScamAlert
                  likelyScam={analysis.likely_scam}
                  scamRisk={analysis.scam_risk}
                  scamSignals={analysis.scam_signals}
                  compact={!isMobile}
                  className={isMobile ? undefined : "[&_ul]:max-h-24 [&_ul]:overflow-y-auto"}
                />
              ) : null}
            </div>
          ) : (
            <p className="text-[13px]" style={{ color: "var(--cc-muted)" }}>No analysis yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
