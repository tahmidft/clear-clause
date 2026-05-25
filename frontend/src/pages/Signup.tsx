import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, MailCheck } from "lucide-react";
import { BrandIcon } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

const DUPLICATE_EMAIL_MARKER = "already exists";

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

export default function Signup() {
  const { signUp, resendConfirmation, signOut, user, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [emailError, setEmailError] = React.useState("");
  const [passwordError, setPasswordError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [confirmationPending, setConfirmationPending] = React.useState<string | null>(null);
  const [resending, setResending] = React.useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--cc-bg)" }} role="status" aria-live="polite" aria-label="Loading">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cc-accent)" }} aria-hidden />
      </div>
    );
  }

  if (user) {
    return (
      <div className="safe-bottom flex min-h-[100dvh] items-center justify-center px-4 py-8 sm:py-12" style={{ background: "var(--cc-bg)" }}>
        <AuthCard>
          <div className="flex justify-center">
            <BrandIcon size={32} className="shrink-0" />
          </div>
          <h1 className="mt-5 text-center" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--cc-title)" }}>
            You&apos;re already signed in
          </h1>
          <p className="mt-2 break-all text-center text-[13px]" style={{ color: "var(--cc-muted)" }}>{user.email}</p>
          <p className="mt-3 text-center text-[13px]" style={{ color: "var(--cc-muted)" }}>
            To create a new account, sign out first. Otherwise continue to your dashboard.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button type="button" className="min-h-11 w-full rounded-[12px] text-[15px]" onClick={() => void navigate("/dashboard", { replace: true })}>
              Go to dashboard
            </Button>
            <Button type="button" variant="outline" className="min-h-11 w-full rounded-[12px] text-[15px]" onClick={async () => { await signOut(); navigate("/signup", { replace: true }); }}>
              Sign out
            </Button>
          </div>
        </AuthCard>
      </div>
    );
  }

  if (confirmationPending) {
    return (
      <div className="safe-bottom flex min-h-[100dvh] items-center justify-center px-4 py-8 sm:py-12" style={{ background: "var(--cc-bg)" }}>
        <AuthCard>
          <div className="flex justify-center">
            <div
              className="flex items-center justify-center rounded-[14px]"
              style={{ width: 52, height: 52, background: "var(--cc-zone-bg)", border: "0.5px solid var(--cc-zone-border)" }}
            >
              <MailCheck className="h-6 w-6" style={{ color: "var(--cc-accent)" }} aria-hidden />
            </div>
          </div>
          <h1 className="mt-4 text-center" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--cc-title)" }}>
            Check your email
          </h1>
          <p className="mt-3 text-center text-[13px]" style={{ color: "var(--cc-muted)" }}>
            We sent a confirmation link to{" "}
            <span className="break-all font-medium" style={{ color: "var(--cc-body)" }}>{confirmationPending}</span>.
          </p>
          <p className="mt-2 text-center text-[13px]" style={{ color: "var(--cc-muted)" }}>
            Open the link to activate your account, then sign in.
          </p>
          <p className="mt-2 text-center text-[12px]" style={{ color: "var(--cc-subtle)" }}>
            Already signed up?{" "}
            <button type="button" className="font-medium underline-offset-4 hover:underline" style={{ color: "var(--cc-auth-link)", background: "none", border: "none", cursor: "pointer" }}
              onClick={() => navigate("/login", { replace: true, state: { email: confirmationPending } })}
            >
              Sign in instead
            </button>
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button type="button" className="min-h-11 w-full rounded-[12px] text-[15px]" onClick={() => navigate("/login", { replace: true, state: { email: confirmationPending } })}>
              Go to sign in
            </Button>
            <Button type="button" variant="outline" className="min-h-11 w-full rounded-[12px] text-[15px]" disabled={resending} aria-busy={resending}
              onClick={async () => {
                setResending(true);
                const { error } = await resendConfirmation(confirmationPending);
                if (error) { toast({ title: "Could not resend email", description: error, variant: "destructive" }); }
                else { toast({ title: "Confirmation email sent", description: "Check your inbox and spam folder." }); }
                setResending(false);
              }}
            >
              {resending ? "Sending…" : "Resend confirmation email"}
            </Button>
            <Button type="button" variant="ghost" className="min-h-11 w-full rounded-[12px] text-[15px]" onClick={() => { setConfirmationPending(null); setPassword(""); }}>
              Use a different email
            </Button>
          </div>
        </AuthCard>
      </div>
    );
  }

  const validate = (): boolean => {
    let ok = true;
    setEmailError(""); setPasswordError("");
    if (!email.trim()) { setEmailError("Email is required."); ok = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setEmailError("Enter a valid email address."); ok = false; }
    if (password.length < 8) { setPasswordError("Use at least 8 characters for your password."); ok = false; }
    return ok;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const result = await signUp(email, password);
    if (result.error) {
      if (result.error.toLowerCase().includes(DUPLICATE_EMAIL_MARKER)) { setEmailError(result.error); }
      else { toast({ title: "Could not create account", description: result.error, variant: "destructive" }); }
      setSubmitting(false); return;
    }
    if (result.needsEmailConfirmation) {
      setConfirmationPending(result.email ?? email.trim());
      setSubmitting(false); return;
    }
    toast({ title: "Account ready", description: "Tell us your preferences next." });
    navigate("/onboarding", { replace: true });
    setSubmitting(false);
  };

  return (
    <div className="safe-bottom flex min-h-[100dvh] items-center justify-center px-4 py-8 sm:py-12" style={{ background: "var(--cc-bg)" }}>
      <AuthCard>
        <div className="flex items-center justify-center gap-2.5">
          <BrandIcon size={32} className="shrink-0" />
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--cc-title)" }}>ClearClause</span>
        </div>
        <h1 className="mt-5 text-center" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--cc-title)" }}>
          Create your account
        </h1>
        <p className="mt-1.5 text-center text-[13px]" style={{ color: "var(--cc-muted)" }}>
          Start analyzing contracts in minutes.
        </p>
        <form className="mt-7 space-y-5" onSubmit={onSubmit} noValidate>
          <div>
            <AuthLabel htmlFor="su-email">Email</AuthLabel>
            <AuthInput id="su-email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!emailError} aria-describedby={emailError ? "su-email-err" : undefined} />
            {emailError ? (
              <p id="su-email-err" className="mt-1.5 text-[12px]" style={{ color: "var(--cc-red)" }} role="alert">
                {emailError.toLowerCase().includes(DUPLICATE_EMAIL_MARKER) ? (
                  <>An account with this email already exists.{" "}<Link to="/login" className="underline underline-offset-4 hover:opacity-80">Sign in instead</Link>{", or "}<Link to="/forgot-password" className="underline underline-offset-4 hover:opacity-80">reset your password</Link>.</>
                ) : emailError}
              </p>
            ) : null}
          </div>
          <div>
            <AuthLabel htmlFor="su-password">Password</AuthLabel>
            <AuthInput id="su-password" name="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!passwordError} aria-describedby={passwordError ? "su-pw-err" : undefined} />
            {passwordError ? (
              <p id="su-pw-err" className="mt-1.5 text-[12px]" style={{ color: "var(--cc-red)" }} role="alert">{passwordError}</p>
            ) : null}
          </div>
          <Button type="submit" className="min-h-11 w-full rounded-[12px] text-[15px]" style={{ fontWeight: 590 }} disabled={submitting} aria-busy={submitting}>
            {submitting ? "Creating account…" : "Sign Up"}
          </Button>
        </form>
        <p className="mt-5 text-center text-[13px]" style={{ color: "var(--cc-auth-footer)" }}>
          Already have an account?{" "}
          <Link to="/login" className="font-medium underline-offset-4 hover:underline" style={{ color: "var(--cc-auth-link)" }}>Sign in</Link>
        </p>
      </AuthCard>
    </div>
  );
}
