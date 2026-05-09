import * as React from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ContractCard } from "@/components/ContractCard";
import { UploadZone } from "@/components/UploadZone";
import { analyzeContract, deleteContract, getAnalysis, getContracts, uploadContract } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import type { Analysis, Contract } from "@/types";

export default function Dashboard() {
  const [contracts, setContracts] = React.useState<Contract[]>([]);
  const [analyses, setAnalyses] = React.useState<Record<string, Analysis | null>>({});
  const [loadingList, setLoadingList] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const [analyzingIds, setAnalyzingIds] = React.useState<Set<string>>(() => new Set());
  const [errorIds, setErrorIds] = React.useState<Set<string>>(() => new Set());
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "completed" | "analyzing" | "failed" | "pending">("all");

  const load = React.useCallback(async () => {
    setLoadingList(true);
    try {
      const list = await getContracts();
      setContracts(list);
      const next: Record<string, Analysis | null> = {};
      await Promise.all(
        list.map(async (c) => {
          try {
            next[c.id] = await getAnalysis(c.id);
          } catch {
            next[c.id] = null;
          }
        }),
      );
      setAnalyses(next);
    } catch {
      /* toasts from api */
    } finally {
      setLoadingList(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const runAnalysisFor = React.useCallback(async (contractId: string) => {
    setAnalyzingIds((prev) => new Set(prev).add(contractId));
    setErrorIds((prev) => {
      const n = new Set(prev);
      n.delete(contractId);
      return n;
    });
    try {
      const a = await analyzeContract(contractId);
      setAnalyses((prev) => ({ ...prev, [contractId]: a }));
    } catch {
      setErrorIds((prev) => new Set(prev).add(contractId));
    } finally {
      setAnalyzingIds((prev) => {
        const n = new Set(prev);
        n.delete(contractId);
        return n;
      });
    }
  }, []);

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

  const onUpload = async (file: File) => {
    if (!validateFile(file)) return;
    setUploading(true);
    try {
      const created = await uploadContract(file);
      setContracts((prev) => [{ ...created, user_id: String(created.user_id) }, ...prev]);
      setAnalyses((prev) => ({ ...prev, [created.id]: null }));
      await runAnalysisFor(created.id);
    } catch {
      /* api toasts */
    } finally {
      setUploading(false);
    }
  };

  const onPickFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.docx";
    input.onchange = () => {
      const f = input.files?.[0];
      if (f) void onUpload(f);
    };
    input.click();
  };

  const onDelete = async (id: string) => {
    try {
      await deleteContract(id);
      setContracts((prev) => prev.filter((c) => c.id !== id));
      setAnalyses((prev) => {
        const n = { ...prev };
        delete n[id];
        return n;
      });
    } catch {
      /* toast */
    }
  };

  const filteredContracts = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return contracts.filter((c) => {
      if (needle && !c.file_name.toLowerCase().includes(needle)) {
        return false;
      }
      if (statusFilter === "all") return true;
      if (statusFilter === "analyzing") return analyzingIds.has(c.id);
      if (statusFilter === "failed") return errorIds.has(c.id);
      if (statusFilter === "completed") return Boolean(analyses[c.id]) && !analyzingIds.has(c.id) && !errorIds.has(c.id);
      return !analyses[c.id] && !analyzingIds.has(c.id) && !errorIds.has(c.id);
    });
  }, [contracts, query, statusFilter, analyzingIds, errorIds, analyses]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-[34px] font-semibold tracking-tight">My Contracts</h1>
          <p className="mt-1 text-[17px] text-[var(--color-secondary)]">Upload a contract to run a fresh AI review.</p>
        </div>
        <Button
          type="button"
          className="min-h-11 shrink-0 rounded-[10px] px-6"
          onClick={onPickFile}
          disabled={uploading}
          aria-busy={uploading}
          aria-label="Upload a new contract"
        >
          {uploading ? (
            "Uploading..."
          ) : (
            <>
              <Upload className="mr-2 h-5 w-5" aria-hidden />
              Upload
            </>
          )}
        </Button>
      </div>

      <div className="mt-8">
        <UploadZone onFileSelected={onUpload} disabled={uploading} className="mb-10" />
        <div className="mb-6 grid gap-3 md:grid-cols-[1fr_auto]">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search contracts by file name"
            className="min-h-11 rounded-[10px]"
            aria-label="Search contracts"
          />
          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "All" },
              { value: "completed", label: "Completed" },
              { value: "analyzing", label: "Analyzing" },
              { value: "failed", label: "Failed" },
              { value: "pending", label: "Pending" },
            ].map((opt) => (
              <Button
                key={opt.value}
                type="button"
                size="sm"
                variant={statusFilter === opt.value ? "default" : "outline"}
                className="rounded-[10px]"
                onClick={() => setStatusFilter(opt.value as typeof statusFilter)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
        {loadingList ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48 rounded-[12px]" />
            ))}
          </div>
        ) : contracts.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-[12px] border border-dashed border-[var(--color-separator)] bg-[var(--color-surface)] px-6 py-20 text-center shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
            role="status"
          >
            <Upload className="h-12 w-12 text-[var(--color-blue)]" aria-hidden />
            <p className="mt-4 max-w-sm text-[17px] text-[var(--color-secondary)]">No contracts yet. Upload your first contract.</p>
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="rounded-[12px] border border-[var(--color-separator)] bg-[var(--color-surface)] px-6 py-10 text-center">
            <p className="text-[17px] text-[var(--color-secondary)]">No contracts match your current filters.</p>
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
          <div className="grid gap-6 md:grid-cols-2">
            {filteredContracts.map((c) => (
              <ContractCard
                key={c.id}
                contract={c}
                analysis={analyses[c.id]}
                isAnalyzing={analyzingIds.has(c.id)}
                analysisError={errorIds.has(c.id)}
                onDelete={() => void onDelete(c.id)}
                onRetryAnalysis={() => void runAnalysisFor(c.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
