import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAnalysis, getContracts } from "@/lib/api";
import type { Analysis, Contract } from "@/types";

export const DASHBOARD_CONTRACTS_KEY = ["dashboard", "contracts"] as const;
export const DASHBOARD_ANALYSES_KEY = ["dashboard", "analyses"] as const;

const ANALYSIS_CONCURRENCY = 4;

async function loadAnalysesBatched(contracts: Contract[]): Promise<Record<string, Analysis | null>> {
  const analyses: Record<string, Analysis | null> = {};
  for (let i = 0; i < contracts.length; i += ANALYSIS_CONCURRENCY) {
    const chunk = contracts.slice(i, i + ANALYSIS_CONCURRENCY);
    await Promise.all(
      chunk.map(async (c) => {
        try {
          analyses[c.id] = await getAnalysis(c.id);
        } catch {
          analyses[c.id] = null;
        }
      }),
    );
  }
  return analyses;
}

export function useDashboardData() {
  const queryClient = useQueryClient();

  const contractsQuery = useQuery({
    queryKey: DASHBOARD_CONTRACTS_KEY,
    queryFn: getContracts,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
  });

  const contractIds = contractsQuery.data?.map((c) => c.id).join(",") ?? "";

  const analysesQuery = useQuery({
    queryKey: [...DASHBOARD_ANALYSES_KEY, contractIds],
    queryFn: () => loadAnalysesBatched(contractsQuery.data ?? []),
    enabled: !!contractsQuery.data,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });

  const contracts = contractsQuery.data ?? [];
  const analyses = analysesQuery.data ?? {};

  const setContracts = (updater: Contract[] | ((prev: Contract[]) => Contract[])) => {
    queryClient.setQueryData(DASHBOARD_CONTRACTS_KEY, (prev: Contract[] | undefined) => {
      const current = prev ?? [];
      return typeof updater === "function" ? updater(current) : updater;
    });
  };

  const setAnalyses = (updater: (prev: Record<string, Analysis | null>) => Record<string, Analysis | null>) => {
    queryClient.setQueryData(
      [...DASHBOARD_ANALYSES_KEY, contractIds],
      (prev: Record<string, Analysis | null> | undefined) => updater(prev ?? {}),
    );
  };

  const patchAnalysis = (contractId: string, analysis: Analysis | null) => {
    setAnalyses((prev) => ({ ...prev, [contractId]: analysis }));
  };

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: DASHBOARD_CONTRACTS_KEY });
    await queryClient.invalidateQueries({ queryKey: DASHBOARD_ANALYSES_KEY });
  };

  const retry = () => {
    void contractsQuery.refetch();
    if (contractsQuery.data) void analysesQuery.refetch();
  };

  return {
    contracts,
    analyses,
    isLoading: contractsQuery.isLoading && !contractsQuery.data,
    isFetching: contractsQuery.isFetching || analysesQuery.isFetching,
    isAnalysesLoading: analysesQuery.isLoading && !!contractsQuery.data && contracts.length > 0,
    isError: contractsQuery.isError,
    error: contractsQuery.error,
    setContracts,
    setAnalyses,
    patchAnalysis,
    invalidate,
    refetch: contractsQuery.refetch,
    retry,
  };
}
