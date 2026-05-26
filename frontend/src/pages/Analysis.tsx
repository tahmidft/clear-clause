import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalysisProgress } from "@/components/AnalysisProgress";
import { AnalysisDetailView } from "@/components/AnalysisDetailView";
import { patchDashboardAnalysis } from "@/lib/dashboardCache";
import { analyzeContract, getAnalysis, getContracts } from "@/lib/api";
import type { Analysis, Contract } from "@/types";

type AnalyzePhase = "idle" | "running" | "finishing";

export default function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [contract, setContract] = React.useState<Contract | null>(null);
  const [analysis, setAnalysis] = React.useState<Analysis | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [analyzePhase, setAnalyzePhase] = React.useState<AnalyzePhase>("idle");
  const [analysisError, setAnalysisError] = React.useState(false);
  const pendingAnalysisRef = React.useRef<Analysis | null>(null);

  const syncDashboard = React.useCallback(
    (contractId: string, value: Analysis | null) => {
      patchDashboardAnalysis(queryClient, contractId, value);
    },
    [queryClient],
  );

  const applyPendingAnalysis = React.useCallback(() => {
    const pending = pendingAnalysisRef.current;
    pendingAnalysisRef.current = null;
    if (pending) {
      setAnalysis(pending);
      if (id) syncDashboard(id, pending);
    }
    setAnalyzePhase("idle");
  }, [id, syncDashboard]);

  const runAnalyze = React.useCallback(
    async (contractId: string) => {
      setAnalyzePhase("running");
      setAnalysisError(false);
      try {
        const result = await analyzeContract(contractId);
        pendingAnalysisRef.current = result;
        syncDashboard(contractId, result);
        setAnalyzePhase("finishing");
      } catch {
        pendingAnalysisRef.current = null;
        setAnalysisError(true);
        setAnalyzePhase("idle");
      }
    },
    [syncDashboard],
  );

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setAnalyzePhase("idle");
      setAnalysisError(false);
      pendingAnalysisRef.current = null;
      try {
        const list = await getContracts();
        if (cancelled) return;
        const c = list.find((x) => x.id === id) ?? null;
        setContract(c ?? null);
        const a = await getAnalysis(id);
        if (cancelled) return;
        if (!a) {
          if (!cancelled) setLoading(false);
          await runAnalyze(id);
          if (cancelled) return;
          return;
        }
        setAnalysis(a);
        syncDashboard(id, a);
      } catch {
        setContract(null);
        setAnalysis(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, runAnalyze, syncDashboard]);

  if (!id) {
    return null;
  }

  const showProgress = analyzePhase === "running" || analyzePhase === "finishing";

  return (
    <div className="min-w-0">
      <Button
        asChild
        variant="default"
        className="mb-6 min-h-11 gap-1.5 rounded-[12px] px-4 text-[15px] font-medium"
      >
        <Link to="/dashboard" aria-label="Back to dashboard">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to dashboard
        </Link>
      </Button>

      {loading ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading analysis">
          <Skeleton className="h-10 w-2/3 max-w-md rounded-md" />
          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 rounded-[12px]" />
              ))}
            </div>
            <Skeleton className="h-96 rounded-[12px] lg:col-span-2" />
          </div>
        </div>
      ) : !contract ? (
        <p className="text-[17px]" style={{ color: "var(--cc-muted)" }}>
          We could not find that contract.
        </p>
      ) : showProgress ? (
        <div className="py-12">
          <AnalysisProgress
            running={analyzePhase === "running"}
            finishing={analyzePhase === "finishing"}
            onFinishComplete={applyPendingAnalysis}
            variant="full"
            title={contract.file_name}
          />
        </div>
      ) : !analysis ? (
        <div className="space-y-4 py-8">
          <p className="text-[17px]" style={{ color: "var(--cc-muted)" }} role="alert">
            {analysisError
              ? "Analysis could not be completed. This can take up to a minute — try again."
              : "Analysis is not available for this file."}
          </p>
          {analysisError ? (
            <Button type="button" className="min-h-11 rounded-[10px]" onClick={() => void runAnalyze(id)}>
              Retry analysis
            </Button>
          ) : null}
        </div>
      ) : (
        <AnalysisDetailView contract={contract} analysis={analysis} />
      )}
    </div>
  );
}
