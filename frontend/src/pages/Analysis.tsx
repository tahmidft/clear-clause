import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionCard } from "@/components/SectionCard";
import { RecommendationPanel } from "@/components/RecommendationPanel";
import { analyzeContract, getAnalysis, getContracts } from "@/lib/api";
import type { Analysis, Contract } from "@/types";

export default function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = React.useState<Contract | null>(null);
  const [analysis, setAnalysis] = React.useState<Analysis | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [analyzing, setAnalyzing] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const list = await getContracts();
        if (cancelled) return;
        const c = list.find((x) => x.id === id) ?? null;
        setContract(c ?? null);
        let a = await getAnalysis(id);
        if (cancelled) return;
        if (!a) {
          setAnalyzing(true);
          try {
            a = await analyzeContract(id);
          } catch {
            a = null;
          } finally {
            setAnalyzing(false);
          }
        }
        setAnalysis(a);
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
  }, [id]);

  if (!id) {
    return null;
  }

  return (
    <div>
      <Button
        asChild
        variant="ghost"
        className="mb-6 min-h-11 rounded-[10px] px-2 text-[var(--color-blue)]"
        aria-label="Back to dashboard"
      >
        <Link to="/dashboard">
          <ArrowLeft className="mr-2 h-5 w-5" aria-hidden />
          Back to dashboard
        </Link>
      </Button>

      {loading ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading analysis">
          <Skeleton className="h-10 w-2/3 max-w-md rounded-md" />
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-40 rounded-[12px]" />
              ))}
            </div>
            <Skeleton className="h-96 rounded-[12px] lg:col-span-2" />
          </div>
        </div>
      ) : !contract ? (
        <p className="text-[17px] text-[var(--color-secondary)]">We could not find that contract.</p>
      ) : analyzing ? (
        <div className="flex flex-col items-center gap-3 py-16" role="status" aria-live="polite">
          <Loader2 className="h-10 w-10 animate-spin text-[var(--color-blue)]" aria-hidden />
          <p className="text-[17px] text-[var(--color-secondary)]">Analyzing your contract...</p>
        </div>
      ) : !analysis ? (
        <p className="text-[17px] text-[var(--color-secondary)]">Analysis is not available for this file.</p>
      ) : (
        <>
          <h1 className="font-display text-[28px] font-semibold tracking-tight sm:text-[34px]">{contract.file_name}</h1>
          <div className="mt-8 grid gap-8 lg:grid-cols-5 lg:gap-10">
            <div className="space-y-6 lg:col-span-3">
              {analysis.sections.map((section, idx) => (
                <SectionCard key={`${section.title}-${idx}`} section={section} />
              ))}
            </div>
            <div className="lg:col-span-2">
              <RecommendationPanel analysis={analysis} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
