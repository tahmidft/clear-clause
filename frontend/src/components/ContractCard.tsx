import * as React from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Loader2, Trash2, XOctagon } from "lucide-react";
import { Card } from "@/components/ui/card";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { Analysis, Contract } from "@/types";

interface ContractCardProps {
  contract: Contract;
  analysis: Analysis | null | undefined;
  isAnalyzing: boolean;
  analysisError: boolean;
  onDelete: () => void;
  onRetryAnalysis: () => void;
}

function MiniScoreRing({ score }: { score: number }) {
  const size = 56;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const dash = c * (1 - pct);
  const color = score > 70 ? "var(--color-green)" : score >= 40 ? "var(--color-yellow)" : "var(--color-red)";
  return (
    <div className="relative h-14 w-14 shrink-0" aria-hidden>
      <svg width={size} height={size} className="-rotate-90">
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
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-[var(--color-label)]">
        {score}
      </span>
    </div>
  );
}

export function ContractCard({
  contract,
  analysis,
  isAnalyzing,
  analysisError,
  onDelete,
  onRetryAnalysis,
}: ContractCardProps) {
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const score = analysis?.overall_score ?? null;
  const accept = analysis?.recommendation === "accept";

  const deleteControls = (
    <>
      {!isMobile ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="min-h-11 min-w-11 shrink-0 rounded-[10px] border-[var(--color-separator)]"
              aria-label={`Delete contract ${contract.file_name}`}
            >
              <Trash2 className="h-4 w-4 text-[var(--color-red)]" aria-hidden />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-[12px]">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this contract?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the file and its analysis from your account. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="min-h-11 rounded-[10px]">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="min-h-11 rounded-[10px] bg-[var(--color-red)] hover:bg-[var(--color-red)]/90"
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
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="min-h-11 min-w-11 shrink-0 rounded-[10px]"
              aria-label={`Delete contract ${contract.file_name}`}
            >
              <Trash2 className="h-4 w-4 text-[var(--color-red)]" aria-hidden />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-[12px]" aria-describedby={undefined}>
            <SheetHeader>
              <SheetTitle>Delete this contract?</SheetTitle>
            </SheetHeader>
            <p className="px-4 pb-4 text-[17px] text-[var(--color-secondary)]">
              This removes the file and its analysis. This cannot be undone.
            </p>
            <SheetFooter className="flex-col gap-2 sm:flex-col">
              <Button
                type="button"
                variant="destructive"
                className="min-h-11 w-full rounded-[10px]"
                onClick={() => {
                  setSheetOpen(false);
                  onDelete();
                }}
              >
                Delete contract
              </Button>
              <Button type="button" variant="outline" className="min-h-11 w-full rounded-[10px]" onClick={() => setSheetOpen(false)}>
                Cancel
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}
    </>
  );

  return (
    <Card className="relative flex flex-col gap-4 rounded-[12px] border border-[var(--color-separator)] bg-[var(--color-surface)] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
      <div className="flex items-start justify-between gap-3">
        <Link
          to={`/analysis/${contract.id}`}
          className="min-h-[44px] min-w-0 flex-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-blue)]"
          aria-label={`Open analysis for ${contract.file_name}`}
        >
          <h3 className="truncate font-display text-lg font-semibold text-[var(--color-label)]">{contract.file_name}</h3>
          <p className="mt-1 text-sm text-[var(--color-secondary)]">
            Uploaded {format(new Date(contract.created_at), "MMM d, yyyy")}
          </p>
        </Link>
        {deleteControls}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {isAnalyzing ? (
          <div className="flex items-center gap-2 text-[var(--color-secondary)]" role="status" aria-live="polite">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-blue)]" aria-hidden />
            <span className="text-[17px]">Analyzing your contract...</span>
          </div>
        ) : analysisError ? (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-[var(--color-red)]" role="alert">
              <AlertTriangle className="h-5 w-5" aria-hidden />
              <span className="text-[17px]">Analysis failed</span>
            </div>
            <Button type="button" variant="secondary" className="min-h-11 rounded-[10px]" onClick={onRetryAnalysis} aria-label="Retry contract analysis">
              Retry analysis
            </Button>
          </div>
        ) : score != null ? (
          <>
            <MiniScoreRing score={score} />
            <div
              className={cn(
                "inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium",
                accept
                  ? "border-[var(--color-green)]/35 bg-[var(--color-green)]/12 text-[var(--color-green)]"
                  : "border-[var(--color-red)]/35 bg-[var(--color-red)]/12 text-[var(--color-red)]",
              )}
              role="status"
            >
              {accept ? <CheckCircle2 className="h-4 w-4" aria-hidden /> : <XOctagon className="h-4 w-4" aria-hidden />}
              <span>{accept ? "Accept" : "Reject"}</span>
            </div>
          </>
        ) : (
          <p className="text-[17px] text-[var(--color-secondary)]">No analysis yet.</p>
        )}
      </div>
    </Card>
  );
}
