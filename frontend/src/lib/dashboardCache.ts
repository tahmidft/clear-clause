import type { QueryClient } from "@tanstack/react-query";
import type { Analysis } from "@/types";

export const DASHBOARD_CONTRACTS_KEY = ["dashboard", "contracts"] as const;
export const DASHBOARD_ANALYSES_KEY = ["dashboard", "analyses"] as const;

/** Update cached analysis for a contract across all dashboard analysis queries. */
export function patchDashboardAnalysis(
  queryClient: QueryClient,
  contractId: string,
  analysis: Analysis | null,
): void {
  queryClient.setQueriesData<Record<string, Analysis | null>>(
    { queryKey: DASHBOARD_ANALYSES_KEY },
    (prev) => {
      if (!prev) return { [contractId]: analysis };
      return { ...prev, [contractId]: analysis };
    },
  );
}

export async function invalidateDashboardData(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: DASHBOARD_CONTRACTS_KEY });
  await queryClient.invalidateQueries({ queryKey: DASHBOARD_ANALYSES_KEY });
}
