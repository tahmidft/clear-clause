import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export default function Signup() {
  const { signUp, signOut, user, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [emailError, setEmailError] = React.useState("");
  const [passwordError, setPasswordError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]" role="status" aria-live="polite" aria-label="Loading">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--color-blue)]" aria-hidden />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-12">
        <Card className="w-full max-w-md rounded-[12px] border border-[var(--color-separator)] bg-[var(--color-surface)] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
          <h1 className="text-center font-display text-[34px] font-semibold">You&apos;re already signed in</h1>
          <p className="mt-3 break-all text-center text-[17px] text-[var(--color-secondary)]">{user.email}</p>
          <p className="mt-4 text-center text-[17px] text-[var(--color-secondary)]">
            To create a new account, sign out first. Otherwise continue to your dashboard.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Button type="button" className="min-h-11 w-full rounded-[10px] text-[17px]" onClick={() => void navigate("/dashboard", { replace: true })}>
              Go to dashboard
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full rounded-[10px] text-[17px]"
              onClick={async () => {
                await signOut();
                navigate("/signup", { replace: true });
              }}
            >
              Sign out
            </Button>
          </div>
        </Card>
      </div>
    );
  }

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
    if (password.length < 8) {
      setPasswordError("Use at least 8 characters for your password.");
      ok = false;
    }
    return ok;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const { error } = await signUp(email, password);
    if (error) {
      toast({
        title: "Could not create account",
        description: error,
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      toast({ title: "Account ready", description: "Tell us your preferences next." });
      navigate("/onboarding", { replace: true });
    } else {
      toast({
        title: "Check your inbox",
        description: "Confirm your email, then sign in to continue.",
      });
      navigate("/login", { replace: true });
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4 py-12">
      <Card className="w-full max-w-md rounded-[12px] border border-[var(--color-separator)] bg-[var(--color-surface)] p-8 shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
        <h1 className="text-center font-display text-[34px] font-semibold">Create your account</h1>
        <p className="mt-2 text-center text-[17px] text-[var(--color-secondary)]">Start analyzing contracts in minutes.</p>
        <form className="mt-8 space-y-6" onSubmit={onSubmit} noValidate>
          <div>
            <Label htmlFor="su-email" className="text-[17px]">
              Email
            </Label>
            <Input
              id="su-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 min-h-11 rounded-[8px] text-[17px]"
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "su-email-err" : undefined}
            />
            {emailError ? (
              <p id="su-email-err" className="mt-1 text-sm text-[var(--color-red)]" role="alert">
                {emailError}
              </p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="su-password" className="text-[17px]">
              Password
            </Label>
            <Input
              id="su-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 min-h-11 rounded-[8px] text-[17px]"
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? "su-pw-err" : undefined}
            />
            {passwordError ? (
              <p id="su-pw-err" className="mt-1 text-sm text-[var(--color-red)]" role="alert">
                {passwordError}
              </p>
            ) : null}
          </div>
          <Button type="submit" className="min-h-11 w-full rounded-[10px] text-[17px]" disabled={submitting} aria-busy={submitting}>
            {submitting ? "Creating account..." : "Sign Up"}
          </Button>
        </form>
        <p className="mt-6 text-center text-[17px] text-[var(--color-secondary)]">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-[var(--color-blue)] underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
