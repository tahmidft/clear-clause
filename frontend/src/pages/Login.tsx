import * as React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { BrandIcon } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { resolvePostLoginPath } from "@/lib/postLoginPath";
import { supabase } from "@/lib/supabase";

function AuthInput({
  id, name, type, autoComplete, value, onChange,
  "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy,
}: {
  id: string; name: string; type: string; autoComplete?: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  "aria-invalid"?: boolean; "aria-describedby"?: string;
}) {
  return (
    <input
      id={id} name={name} type={type} autoComplete={autoComplete}
      value={value} onChange={onChange}
      aria-invalid={ariaInvalid} aria-describedby={ariaDescribedBy}
      className="mt-2 w-full rounded-[10px] px-4 py-3 text-[14px] outline-none focus:ring-1 focus:ring-[var(--cc-accent)]"
      style={{
        background: "var(--cc-input-bg)",
        border: ariaInvalid ? "0.5px solid var(--cc-input-border-err)" : "0.5px solid var(--cc-input-border)",
        color: "var(--cc-input-color)",
        transition: "border-color 0.2s ease",
      }}
    />
  );
}

function AuthLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-[13px] font-medium" style={{ color: "var(--cc-auth-label)" }}>
      {children}
    </label>
  );
}

function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-full max-w-[400px] rounded-[18px] p-7 sm:p-8"
      style={{
        background: "var(--cc-auth-card-bg)",
        border: "0.5px solid var(--cc-auth-card-border)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {children}
    </div>
  );
}

export default function Login() {
  const { signIn, resendConfirmation, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";
  const prefilledEmail = (location.state as { email?: string } | null)?.email ?? "";

  const [email, setEmail] = React.useState(prefilledEmail);
  const [password, setPassword] = React.useState("");
  const [emailError, setEmailError] = React.useState("");
  const [passwordError, setPasswordError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [needsConfirmation, setNeedsConfirmation] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [redirecting, setRedirecting] = React.useState(false);

  React.useEffect(() => {
    if (prefilledEmail) setEmail(prefilledEmail);
  }, [prefilledEmail]);

  React.useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    setRedirecting(true);
    void resolvePostLoginPath(from).then((path) => {
      if (!cancelled) navigate(path, { replace: true });
    }).finally(() => {
      if (!cancelled) setRedirecting(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user, loading, navigate, from]);

  if (loading || (user && redirecting)) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--cc-bg)" }} role="status" aria-live="polite" aria-label="Loading">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cc-accent)" }} aria-hidden />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--cc-bg)" }} role="status" aria-live="polite" aria-label="Loading">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cc-accent)" }} aria-hidden />
      </div>
    );
  }

  const validate = (): boolean => {
    let ok = true;
    setEmailError("");
    setPasswordError("");
    if (!email.trim()) { setEmailError("Email is required."); ok = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setEmailError("Enter a valid email address."); ok = false; }
    if (!password) { setPasswordError("Password is required."); ok = false; }
    return ok;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setNeedsConfirmation(false);
    const { error } = await signIn(email, password);
    if (error) {
      const unconfirmed = /confirm your email/i.test(error);
      setNeedsConfirmation(unconfirmed);
      setPasswordError(error);
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
      navigate(await resolvePostLoginPath("/dashboard"), { replace: true });
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "We could not reach the server. Check your connection and try again.";
      setPasswordError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="safe-bottom flex min-h-[100dvh] items-center justify-center px-4 py-8 sm:py-12" style={{ background: "var(--cc-bg)" }}>
      <AuthCard>
        <div className="flex items-center justify-center gap-2.5">
          <BrandIcon size={32} className="shrink-0" />
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--cc-title)" }}>ClearClause</span>
        </div>

        <h1 className="mt-5 text-center" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--cc-title)" }}>
          Welcome back
        </h1>
        <p className="mt-1.5 text-center text-[13px]" style={{ color: "var(--cc-muted)" }}>
          Sign in to review your contracts.
        </p>

        <form className="mt-7 space-y-5" onSubmit={onSubmit} noValidate>
          <div>
            <AuthLabel htmlFor="email">Email</AuthLabel>
            <AuthInput
              id="email" name="email" type="email" autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!emailError} aria-describedby={emailError ? "email-err" : undefined}
            />
            {emailError ? (
              <p id="email-err" className="mt-1.5 text-[12px]" style={{ color: "var(--cc-red)" }} role="alert">
                {emailError}
              </p>
            ) : null}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <AuthLabel htmlFor="password">Password</AuthLabel>
              <Link to="/forgot-password" className="text-[12px] font-medium underline-offset-4 hover:underline" style={{ color: "var(--cc-auth-link)" }}>
                Forgot password?
              </Link>
            </div>
            <AuthInput
              id="password" name="password" type="password" autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!passwordError} aria-describedby={passwordError ? "pw-err" : undefined}
            />
            {passwordError ? (
              <p id="pw-err" className="mt-1.5 text-[12px]" style={{ color: "var(--cc-red)" }} role="alert">
                {passwordError}
              </p>
            ) : null}
            {needsConfirmation ? (
              <div className="mt-3">
                <Button type="button" variant="outline" className="w-full rounded-[10px] text-[13px]"
                  disabled={resending} aria-busy={resending}
                  onClick={async () => {
                    setResending(true);
                    const { error: resendError } = await resendConfirmation(email);
                    if (resendError) setPasswordError(resendError);
                    else { setPasswordError("Confirmation email sent. Check your inbox and spam folder."); setNeedsConfirmation(false); }
                    setResending(false);
                  }}
                >
                  {resending ? "Sending…" : "Resend confirmation email"}
                </Button>
              </div>
            ) : null}
          </div>

          <Button type="submit" className="min-h-11 w-full rounded-[12px] text-[15px]" style={{ fontWeight: 590 }} disabled={submitting} aria-busy={submitting}>
            {submitting ? "Signing in…" : "Sign In"}
          </Button>
        </form>

        <p className="mt-5 text-center text-[13px]" style={{ color: "var(--cc-auth-footer)" }}>
          New here?{" "}
          <Link to="/signup" className="font-medium underline-offset-4 hover:underline" style={{ color: "var(--cc-auth-link)" }}>
            Create an account
          </Link>
        </p>
      </AuthCard>
    </div>
  );
}
