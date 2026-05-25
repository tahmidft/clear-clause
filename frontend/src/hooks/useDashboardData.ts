import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAnalysis, getContracts } from "@/lib/api";
import type { Analysis, Contract } from "@/types";

export const DASHBOARD_QUERY_KEY = ["dashboard", "contracts"] as const;

async function fetchDashboardData(): Promise<{
  contracts: Contract[];
  analyses: Record<string, Analysis | null>;
}> {
  const contracts = await getContracts();
  const analyses: Record<string, Analysis | null> = {};
  await Promise.all(
    contracts.map(async (c) => {
      try {
        analyses[c.id] = await getAnalysis(c.id);
      } catch {
        analyses[c.id] = null;
      }
    }),
  );
  return { contracts, analyses };
}

export function useDashboardData() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: fetchDashboardData,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const setContracts = (updater: Contract[] | ((prev: Contract[]) => Contract[])) => {
    queryClient.setQueryData(DASHBOARD_QUERY_KEY, (old: typeof query.data) => {
      const prev = old?.contracts ?? [];
      const contracts = typeof updater === "function" ? updater(prev) : updater;
      return { contracts, analyses: old?.analyses ?? {} };
    });
  };

  const setAnalyses = (updater: (prev: Record<string, Analysis | null>) => Record<string, Analysis | null>) => {
    queryClient.setQueryData(DASHBOARD_QUERY_KEY, (old: typeof query.data) => {
      if (!old) return old;
      return { ...old, analyses: updater(old.analyses) };
    });
  };

  const patchAnalysis = (contractId: string, analysis: Analysis | null) => {
    setAnalyses((prev) => ({ ...prev, [contractId]: analysis }));
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });

  return {
    contracts: query.data?.contracts ?? [],
    analyses: query.data?.analyses ?? {},
    isLoading: query.isLoading && !query.data,
    isFetching: query.isFetching,
    setContracts,
    setAnalyses,
    patchAnalysis,
    invalidate,
    refetch: query.refetch,
  };
}
