import { beforeEach, describe, expect, it, vi } from "vitest";
import { getContracts } from "@/lib/api";

const { signOut } = vi.hoisted(() => ({ signOut: vi.fn() }));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: { access_token: "token" } }, error: null })),
      signOut,
    },
  },
}));

describe("api client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("VITE_API_URL", "http://127.0.0.1:8000");
  });

  it("signs out on 401 responses", async () => {
    global.fetch = vi.fn(async () => new Response("{}", { status: 401 })) as unknown as typeof fetch;
    await expect(getContracts()).rejects.toThrow();
    expect(signOut).toHaveBeenCalled();
  });
});

