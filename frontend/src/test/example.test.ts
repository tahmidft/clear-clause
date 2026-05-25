import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";

const authMock = {
  signIn: vi.fn(),
  signUp: vi.fn(),
  resendConfirmation: vi.fn(),
  signOut: vi.fn(),
  user: null as User | null,
  session: null,
  loading: false,
};

const navigateMock = vi.fn();

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => authMock,
}));

vi.mock("@/lib/api", () => ({
  getPreferences: vi.fn(async () => null),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
    },
  },
}));

describe("auth pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.user = null;
    authMock.loading = false;
    authMock.signUp.mockResolvedValue({ error: null, needsEmailConfirmation: false, email: null });
    authMock.signIn.mockResolvedValue({ error: null });
    authMock.resendConfirmation.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    authMock.user = null;
  });

  it("renders email/password auth actions", () => {
    const { unmount } = render(React.createElement(MemoryRouter, null, React.createElement(Login)));
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    unmount();
    render(React.createElement(MemoryRouter, null, React.createElement(Signup)));
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
  });

  it("shows signed-in choices instead of skipping the login form", () => {
    authMock.user = { id: "u1", email: "you@example.com" } as User;
    render(React.createElement(MemoryRouter, null, React.createElement(Login)));
    expect(screen.getByRole("heading", { name: /you're signed in/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^continue$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });

  it("validates login form fields", () => {
    render(React.createElement(MemoryRouter, null, React.createElement(Login)));
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it("shows check your email screen when confirmation is required", async () => {
    authMock.signUp.mockResolvedValue({
      error: null,
      needsEmailConfirmation: true,
      email: "new@example.com",
    });

    render(React.createElement(MemoryRouter, null, React.createElement(Signup)));

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "new@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /check your email/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/new@example.com/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /resend confirmation email/i })).toBeInTheDocument();
  });

  it("shows unconfirmed email guidance on login", async () => {
    authMock.signIn.mockResolvedValue({
      error: "Confirm your email first. Check your inbox and spam folder, then try again.",
    });

    render(React.createElement(MemoryRouter, null, React.createElement(Login)));

    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: "new@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/confirm your email first/i)).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /resend confirmation email/i })).toBeInTheDocument();
  });
});
