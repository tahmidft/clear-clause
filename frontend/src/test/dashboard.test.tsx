import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import Dashboard from "@/pages/Dashboard";
import { PreferencesProvider } from "@/context/PreferencesContext";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "you@example.com" } as User,
    session: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    resendConfirmation: vi.fn(),
    resetPassword: vi.fn(),
    updatePassword: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: vi.fn() }),
}));

vi.stubGlobal(
  "IntersectionObserver",
  vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
);

vi.mock("@/lib/api", () => ({
  getContracts: vi.fn(async () => [
    { id: "1", user_id: "u1", file_name: "msa.pdf", file_url: null, created_at: new Date().toISOString() },
    { id: "2", user_id: "u1", file_name: "nda.docx", file_url: null, created_at: new Date().toISOString() },
  ]),
  getAnalysis: vi.fn(async (id: string) =>
    id === "1"
      ? {
          id: "a1",
          contract_id: "1",
          sections: [],
          overall_score: 78,
          recommendation: "accept",
          recommendation_reason: "",
          preference_conflicts: [],
          likely_scam: false,
          scam_risk: "low",
          scam_signals: [],
        }
      : null,
  ),
  getPreferences: vi.fn(async () => ({
    id: "p1",
    user_id: "u1",
    payment_terms_days: 30,
    requires_deposit: true,
    min_deposit_percent: 25,
    ip_ownership: false,
    written_scope_required: true,
    unpaid_revisions: false,
    max_revision_rounds: 2,
    non_compete: false,
    termination_notice_days: 14,
    liability_cap_required: true,
    accepts_broad_indemnification: false,
    kill_fee_required: true,
  })),
  analyzeContract: vi.fn(),
  deleteContract: vi.fn(),
  uploadContract: vi.fn(),
}));

function renderDashboard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <PreferencesProvider>
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>
      </PreferencesProvider>
    </QueryClientProvider>,
  );
}

describe("dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("filters contracts by name", async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText("msa.pdf")).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/search contracts/i), { target: { value: "nda" } });
    expect(screen.queryByText("msa.pdf")).not.toBeInTheDocument();
    expect(screen.getByText("nda.docx")).toBeInTheDocument();
  });
});
