import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";

function renderDashboard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

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
  analyzeContract: vi.fn(),
  deleteContract: vi.fn(),
  uploadContract: vi.fn(),
}));

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

