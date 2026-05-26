import * as React from "react";
import { useLocation } from "react-router-dom";
import { AlertCircle, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalysisCompleteDialog } from "@/components/AnalysisCompleteDialog";
import { AnalysisProgress } from "@/components/AnalysisProgress";
import { BatchReviewPanel, type BatchReviewItem } from "@/components/BatchReviewPanel";
import { BatchReviewPickerDialog, type BatchPickerItem } from "@/components/BatchReviewPickerDialog";
import { ContractCard } from "@/components/ContractCard";
import { DashboardSection } from "@/components/DashboardSection";
import { UploadZone } from "@/components/UploadZone";
import { BUCKET_ORDER, type ContractBucket, contractBucket } from "@/lib/contractBuckets";
import { useDashboardData } from "@/hooks/useDashboardData";
import { analyzeContract, deleteContract, uploadContract } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import type { Contract } from "@/types";

type ProgressSession = {
  contractId: string;
  fileName: string;
  running: boolean;
  finishing: boolean;
};

export default function Dashboard() {
  const location = useLocation();
  const prevPathRef = React.useRef(location.pathname);
  const {
    contracts,
    analyses,
    isLoading,
    isFetching,
    isAnalysesLoading,
    isError,
    error,
    setContracts,
    patchAnalysis,
    invalidate,
    retry,
  } = useDashboardData();

  // Returning from analysis view: refetch so buckets match server (backup if cache patch missed).
  React.useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = location.pathname;
    if (location.pathname === "/dashboard" && prev.startsWith("/analysis/")) {
      void invalidate();
    }
  }, [location.pathname, invalidate]);

  const [uploading, setUploading] = React.useState(false);
  const [batchMode, setBatchMode] = React.useState(false);
  const [batchProgress, setBatchProgress] = React.useState<{ current: number; total: number } | null>(null);
  const [analyzingIds, setAnalyzingIds] = React.useState<Set<string>>(() => new Set());
  const [errorIds, setErrorIds] = React.useState<Set<string>>(() => new Set());
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "completed" | "analyzing" | "failed" | "pending">("all");
  const [sortBy, setSortBy] = React.useState<"ranked" | "recent">("ranked");
  const [progressSession, setProgressSession] = React.useState<ProgressSession | null>(null);
  const [completeDialog, setCompleteDialog] = React.useState<{ contractId: string; fileName: string } | null>(null);
  const [batchPickerOpen, setBatchPickerOpen] = React.useState(false);
  const [batchPickerItems, setBatchPickerItems] = React.useState<BatchPickerItem[]>([]);
  const [batchReview, setBatchReview] = React.useState<{ items: BatchReviewItem[]; activeId: string } | null>(null);

  const isBatchUploadRef = React.useRef(false);
  const batchCollectedRef = React.useRef<BatchPickerItem[]>([]);

  const handleProgressFinish = React.useCallback(() => {
    setProgressSession((current) => {
      if (current) {
        setAnalyzingIds((prev) => {
          const next = new Set(prev);
          next.delete(current.contractId);
          return next;
        });
        const wasBatch = isBatchUploadRef.current;
        if (wasBatch) {
          isBatchUploadRef.current = false;
        } else {
          setCompleteDialog({ contractId: current.contractId, fileName: current.fileName });
        }
      }
      return null;
    });
  }, []);

  const runAnalysisFor = React.useCallback(
    async (contractId: string, fileName?: string) => {
      const name = fileName ?? contracts.find((c) => c.id === contractId)?.file_name ?? "Contract";
      setProgressSession({ contractId, fileName: name, running: true, finishing: false });
      setAnalyzingIds((prev) => new Set(prev).add(contractId));
      setErrorIds((prev) => {
        const next = new Set(prev);
        next.delete(contractId);
        return next;
      });
      try {
        const a = await analyzeContract(contractId);
        patchAnalysis(contractId, a);
        setProgressSession((prev) =>
          prev?.contractId === contractId ? { ...prev, running: false, finishing: true } : prev,
        );
        // Sync server state so navigating away and back shows the correct bucket.
        void invalidate();
      } catch {
        setErrorIds((prev) => new Set(prev).add(contractId));
        setProgressSession(null);
        setAnalyzingIds((prev) => {
          const next = new Set(prev);
          next.delete(contractId);
          return next;
        });
      }
    },
    [contracts, patchAnalysis, invalidate],
  );

  const validateFile = (file: File): boolean => {
    const name = file.name.toLowerCase();
    if (!name.endsWith(".pdf") && !name.endsWith(".docx")) {
      toast({
        title: "Unsupported file",
        description: "Please upload a PDF or DOCX contract.",
        variant: "destructive",
      });
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum upload size is 10 MB.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const onUploadOne = async (file: File, opts?: { partOfBatch?: boolean }) => {
    if (!validateFile(file)) return null;
    const created = await uploadContract(file);
    const row: Contract = { ...created, user_id: String(created.user_id) };
    setContracts((prev) => [row, ...prev]);
    patchAnalysis(created.id, null);
    await runAnalysisFor(created.id, created.file_name);
    if (opts?.partOfBatch) {
      batchCollectedRef.current.push({ contractId: created.id, fileName: created.file_name });
    }
    return created;
  };

  const startBatchReview = React.useCallback(
    (selectedIds: string[]) => {
      const items = batchPickerItems.filter((i) => selectedIds.includes(i.contractId));
      if (!items.length) return;
      const sorted = [...items].sort((a, b) => {
        const scoreA = analyses[a.contractId]?.overall_score ?? -1;
        const scoreB = analyses[b.contractId]?.overall_score ?? -1;
        return scoreB - scoreA;
      });
      setBatchReview({ items: sorted, activeId: sorted[0].contractId });
      setSortBy("ranked");
    },
    [batchPickerItems, analyses],
  );

  const onUploadMany = async (files: File[]) => {
    const valid = files.filter((f) => {
      const n = f.name.toLowerCase();
      return (n.endsWith(".pdf") || n.endsWith(".docx")) && f.size <= 10 * 1024 * 1024;
    });
    if (!valid.length) return;

    const isBatch = valid.length > 1;
    isBatchUploadRef.current = isBatch;
    batchCollectedRef.current = [];

    setUploading(true);
    if (isBatch) {
      setBatchMode(true);
      setBatchProgress({ current: 0, total: valid.length });
    }
    let done = 0;
    try {
      for (const file of valid) {
        if (isBatch) {
          setBatchProgress({ current: done + 1, total: valid.length });
        }
        await onUploadOne(file, { partOfBatch: isBatch });
        done += 1;
      }
      if (isBatch) {
        setCompleteDialog(null);
        setBatchPickerItems([...batchCollectedRef.current]);
        setBatchPickerOpen(true);
        setBatchMode(false);
      }
      setSortBy("ranked");
    } catch {
      /* api toasts */
    } finally {
      setUploading(false);
      setBatchProgress(null);
      if (!isBatch) {
        isBatchUploadRef.current = false;
        setBatchMode(false);
      }
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteContract(id);
      setContracts((prev) => prev.filter((c) => c.id !== id));
      patchAnalysis(id, null);
      setAnalyzingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setErrorIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (progressSession?.contractId === id) setProgressSession(null);
      if (completeDialog?.contractId === id) setCompleteDialog(null);
      if (batchReview?.items.some((i) => i.contractId === id)) {
        const nextItems = batchReview.items.filter((i) => i.contractId !== id);
        setBatchReview(
          nextItems.length
            ? { items: nextItems, activeId: nextItems[0]?.contractId ?? batchReview.activeId }
            : null,
        );
      }
      setBatchPickerItems((prev) => prev.filter((i) => i.contractId !== id));
      void invalidate();
    } catch {
      /* toast from api */
    }
  };

  const filteredContracts = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return contracts.filter((c) => {
      if (needle && !c.file_name.toLowerCase().includes(needle)) {
        return false;
      }
      const busy = analyzingIds.has(c.id) || progressSession?.contractId === c.id;
      if (statusFilter === "all") return true;
      if (statusFilter === "analyzing") return busy;
      if (statusFilter === "failed") return errorIds.has(c.id);
      if (statusFilter === "completed") return Boolean(analyses[c.id]) && !busy && !errorIds.has(c.id);
      return !analyses[c.id] && !busy && !errorIds.has(c.id);
    });
  }, [contracts, query, statusFilter, analyzingIds, errorIds, analyses, progressSession]);

  const sortContracts = React.useCallback(
    (list: Contract[]) => {
      const sorted = [...list];
      if (sortBy === "ranked") {
        sorted.sort((a, b) => {
          const scoreA = analyses[a.id]?.overall_score ?? -1;
          const scoreB = analyses[b.id]?.overall_score ?? -1;
          if (scoreB !== scoreA) return scoreB - scoreA;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      } else {
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
      return sorted;
    },
    [sortBy, analyses],
  );

  const contractsByBucket = React.useMemo(() => {
    const map: Record<ContractBucket, Contract[]> = {
      accept: [],
      reject: [],
      likely_scam: [],
      analyzing: [],
      failed: [],
      pending: [],
    };
    for (const c of filteredContracts) {
      const busy = analyzingIds.has(c.id) || progressSession?.contractId === c.id;
      const bucket = contractBucket(analyses[c.id], {
        analyzing: busy,
        failed: errorIds.has(c.id),
      });
      map[bucket].push(c);
    }
    for (const key of BUCKET_ORDER) {
      map[key] = sortContracts(map[key]);
    }
    return map;
  }, [filteredContracts, analyses, analyzingIds, errorIds, progressSession, sortContracts]);

  const hasAnyInBuckets = BUCKET_ORDER.some((b) => contractsByBucket[b].length > 0);

  const analysisBusy = Boolean(progressSession) || analyzingIds.size > 0 || uploading;
  const showInitialSkeleton = isLoading && contracts.length === 0;
  const loadErrorMessage =
    error instanceof Error
      ? error.message
      : "We could not load your contracts. The server may be waking up — try again.";

  const statusOptions = [
    { value: "all", label: "All" },
    { value: "completed", label: "Completed" },
    { value: "analyzing", label: "Analyzing" },
    { value: "failed", label: "Failed" },
    { value: "pending", label: "Pending" },
  ] as const;

  return (
    <div className="min-w-0">
      {completeDialog ? (
        <AnalysisCompleteDialog
          open
          contractId={completeDialog.contractId}
          fileName={completeDialog.fileName}
          onClose={() => setCompleteDialog(null)}
        />
      ) : null}

      <BatchReviewPickerDialog
        open={batchPickerOpen}
        items={batchPickerItems}
        analyses={analyses}
        errorIds={errorIds}
        onOpenChange={setBatchPickerOpen}
        onStartReview={startBatchReview}
      />

      {/* Page header */}
      <div className="min-w-0">
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--cc-title)",
            lineHeight: 1.2,
          }}
        >
          My Contracts
        </h1>
        <p
          className="mt-1 leading-relaxed"
          style={{ fontSize: 13, color: "var(--cc-muted)" }}
        >
          Contracts are grouped by recommendation.{" "}
          <span className="lg:hidden">Tap</span>
          <span className="hidden lg:inline">Hover</span> scam cards for details.
        </p>
      </div>

      {progressSession ? (
        <div className="mt-6">
          <AnalysisProgress
            running={progressSession.running}
            finishing={progressSession.finishing}
            onFinishComplete={handleProgressFinish}
            variant="full"
            title={progressSession.fileName}
            batchLabel={
              batchProgress
                ? `Processing ${batchProgress.current} of ${batchProgress.total}`
                : undefined
            }
          />
        </div>
      ) : null}

      {batchReview ? (
        <div className="mt-6">
          <BatchReviewPanel
            items={batchReview.items}
            activeId={batchReview.activeId}
            onActiveChange={(id) => setBatchReview((prev) => (prev ? { ...prev, activeId: id } : prev))}
            onClose={() => setBatchReview(null)}
            contracts={contracts}
            analyses={analyses}
            errorIds={errorIds}
          />
        </div>
      ) : null}

      <div className="mt-8">
        <UploadZone onFilesSelected={(files) => void onUploadMany(files)} disabled={analysisBusy} className="mb-8" />

        {/* Search + Sort/Filter controls */}
        <div className="mb-6 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
              style={{ color: "var(--cc-placeholder)" }}
              aria-hidden
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contracts by file name"
              className="w-full rounded-[10px] py-2.5 pl-9 pr-4 outline-none focus:ring-1 focus:ring-[var(--cc-accent)]"
              style={{
                background: "var(--cc-search-bg)",
                border: "0.5px solid var(--cc-search-border)",
                color: "var(--cc-body)",
                fontSize: 14,
                transition: "border-color 0.2s ease",
              }}
              aria-label="Search contracts"
            />
          </div>

          {/* Sort + Filter row */}
          <div className="touch-scroll-x scroll-fade-x -mx-1 flex flex-wrap items-center gap-2 overflow-x-auto px-1 pb-1 sm:overflow-visible sm:pb-0">
            {/* Sort pills */}
            {(["ranked", "recent"] as const).map((val) => (
              <button
                key={val}
                type="button"
                className="shrink-0 rounded-[20px] px-3 py-1.5 text-[13px] font-medium outline-none"
                style={{
                  border: sortBy === val
                    ? "0.5px solid var(--cc-pill-active-border)"
                    : "0.5px solid var(--cc-pill-border)",
                  background: sortBy === val ? "var(--cc-pill-active-bg)" : "transparent",
                  color: sortBy === val ? "var(--cc-pill-active-color)" : "var(--cc-pill-color)",
                  cursor: "pointer",
                  transition: "background 0.2s ease, color 0.2s ease, border-color 0.2s ease",
                }}
                onClick={() => setSortBy(val)}
              >
                {val === "ranked" ? "Best score" : "Recent"}
              </button>
            ))}

            {/* Status segmented control */}
            <div
              className="flex shrink-0 items-center rounded-[9px] p-[2px]"
              style={{ background: "var(--cc-seg-outer-bg)" }}
              role="group"
              aria-label="Filter by status"
            >
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className="rounded-[7px] px-[11px] py-[5px] text-[12px] font-medium outline-none"
                  style={{
                    background: statusFilter === opt.value ? "var(--cc-seg-active-bg)" : "transparent",
                    color: statusFilter === opt.value ? "#ffffff" : "var(--cc-seg-color)",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.2s ease, color 0.2s ease",
                  }}
                  onClick={() => setStatusFilter(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isError && !showInitialSkeleton ? (
          <div
            className="mb-6 flex flex-col gap-3 rounded-[14px] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            style={{
              border: "0.5px solid var(--cc-input-border-err)",
              background: "var(--cc-pref-row-bg)",
            }}
            role="alert"
          >
            <div className="flex min-w-0 items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: "var(--cc-red)" }} aria-hidden />
              <p className="text-[14px] leading-relaxed" style={{ color: "var(--cc-body)" }}>
                {loadErrorMessage}
              </p>
            </div>
            <Button type="button" variant="outline" className="shrink-0" onClick={() => retry()}>
              Try again
            </Button>
          </div>
        ) : null}

        {isFetching && !showInitialSkeleton && !isError ? (
          <p className="mb-4 text-sm" style={{ color: "var(--cc-muted)" }} role="status" aria-live="polite">
            Refreshing…
          </p>
        ) : null}

        {isAnalysesLoading && contracts.length > 0 && !isError ? (
          <p className="mb-4 text-sm" style={{ color: "var(--cc-muted)" }} role="status" aria-live="polite">
            Loading analysis scores…
          </p>
        ) : null}

        {showInitialSkeleton ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48 rounded-[14px]" />
            ))}
          </div>
        ) : contracts.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-[14px] px-6 py-20 text-center"
            style={{
              border: "1.5px dashed var(--cc-zone-border)",
              background: "var(--cc-zone-bg)",
            }}
            role="status"
          >
            <Upload className="h-10 w-10" style={{ color: "var(--cc-accent)" }} aria-hidden />
            <p className="mt-4 max-w-sm text-[15px]" style={{ color: "var(--cc-muted)" }}>
              No contracts yet. Upload your first contract.
            </p>
          </div>
        ) : !hasAnyInBuckets ? (
          <div
            className="rounded-[14px] px-6 py-10 text-center"
            style={{ border: "0.5px solid var(--cc-card-border)", background: "var(--cc-card-bg)" }}
          >
            <p className="text-[15px]" style={{ color: "var(--cc-muted)" }}>
              No contracts match your current filters.
            </p>
            <Button
              type="button"
              variant="ghost"
              className="mt-2"
              onClick={() => {
                setQuery("");
                setStatusFilter("all");
              }}
            >
              Reset filters
            </Button>
          </div>
        ) : (
          <div>
            {BUCKET_ORDER.map((bucket) => (
              <DashboardSection key={bucket} bucket={bucket} count={contractsByBucket[bucket].length}>
                {contractsByBucket[bucket].map((c) => {
                  const isFinishing = progressSession?.contractId === c.id && progressSession.finishing;
                  const isAnalyzing = analyzingIds.has(c.id) && !isFinishing;
                  return (
                    <ContractCard
                      key={c.id}
                      contract={c}
                      analysis={analyses[c.id]}
                      isAnalyzing={isAnalyzing || isFinishing}
                      isFinishing={isFinishing}
                      batchMode={batchMode || isBatchUploadRef.current}
                      analysisError={errorIds.has(c.id)}
                      onDelete={() => void onDelete(c.id)}
                      onRetryAnalysis={() => void runAnalysisFor(c.id, c.file_name)}
                    />
                  );
                })}
              </DashboardSection>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
