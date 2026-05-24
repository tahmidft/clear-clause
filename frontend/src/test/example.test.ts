import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";

const authMock = {
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  user: null as User | null,
  session: null,
  loading: false,
};

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => authMock,
}));

vi.mock("@/lib/api", () => ({
  getPreferences: vi.fn(async () => null),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null } })),
    },
  },
}));

describe("auth pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.user = null;
    authMock.loading = false;
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
});
