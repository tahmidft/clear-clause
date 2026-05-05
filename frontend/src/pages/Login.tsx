import * as React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { getPreferences } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [emailError, setEmailError] = React.useState("");
  const [passwordError, setPasswordError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!loading && user) {
      void navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);

  const validate = (): boolean => {
    let ok = true;
    setEmailError("");
    setPasswordError("");
    if (!email.trim()) {
      setEmailError("Email is required.");
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Enter a valid email address.");
      ok = false;
    }
    if (!password) {
      setPasswordError("Password is required.");
      ok = false;
    }
    return ok;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      setPasswordError("Those details do not match our records. Try again.");
      setSubmitting(false);
      return;
    }
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setPasswordError("We could not complete sign in. Please try again.");
      setSubmitting(false);
      return;
    }
    try {
      const prefs = await getPreferences();
      navigate(prefs ? "/dashboard" : "/onboarding", { replace: true });
    } catch {
      navigate("/dashboard", { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-12">
      <Card className="w-full max-w-md rounded-[12px] border border-[var(--color-separator)] bg-[var(--color-surface)] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
        <h1 className="text-center font-display text-[34px] font-semibold">Welcome back</h1>
        <p className="mt-2 text-center text-[17px] text-[var(--color-secondary)]">Sign in to review your contracts.</p>
        <form className="mt-8 space-y-6" onSubmit={onSubmit} noValidate>
          <div>
            <Label htmlFor="email" className="text-[17px]">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 min-h-11 rounded-[8px] text-[17px]"
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "email-err" : undefined}
            />
            {emailError ? (
              <p id="email-err" className="mt-1 text-sm text-[var(--color-red)]" role="alert">
                {emailError}
              </p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="password" className="text-[17px]">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 min-h-11 rounded-[8px] text-[17px]"
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? "pw-err" : undefined}
            />
            {passwordError ? (
              <p id="pw-err" className="mt-1 text-sm text-[var(--color-red)]" role="alert">
                {passwordError}
              </p>
            ) : null}
          </div>
          <Button type="submit" className="min-h-11 w-full rounded-[10px] text-[17px]" disabled={submitting} aria-busy={submitting}>
            {submitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>
        <p className="mt-6 text-center text-[17px] text-[var(--color-secondary)]">
          New here?{" "}
          <Link to="/signup" className="font-medium text-[var(--color-blue)] underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      </Card>
    </div>
  );
}
