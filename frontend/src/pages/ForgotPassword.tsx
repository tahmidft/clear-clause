import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, MailCheck } from "lucide-react";
import { BrandIcon } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

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

export default function ForgotPassword() {
  const { resetPassword, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = React.useState("");
  const [emailError, setEmailError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--cc-bg)" }} role="status" aria-live="polite" aria-label="Loading">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cc-accent)" }} aria-hidden />
      </div>
    );
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12" style={{ background: "var(--cc-bg)" }}>
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
            If <span className="break-all font-medium" style={{ color: "var(--cc-body)" }}>{email.trim()}</span> is linked to an account, you&apos;ll receive a password reset link shortly.
          </p>
          <p className="mt-2 text-center text-[12px]" style={{ color: "var(--cc-subtle)" }}>
            Don&apos;t see it? Check your spam folder, or{" "}
            <button type="button" className="font-medium underline-offset-4 hover:underline" style={{ color: "var(--cc-auth-link)", background: "none", border: "none", cursor: "pointer" }} onClick={() => setSent(false)}>
              try again
            </button>.
          </p>
          <div className="mt-6">
            <Button type="button" className="min-h-11 w-full rounded-[12px] text-[15px]" onClick={() => navigate("/login", { replace: true })}>
              Back to sign in
            </Button>
          </div>
        </AuthCard>
      </div>
    );
  }

  const validate = (): boolean => {
    setEmailError("");
    if (!email.trim()) { setEmailError("Email is required."); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setEmailError("Enter a valid email address."); return false; }
    return true;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const { error } = await resetPassword(email);
    if (error) { setEmailError(error); setSubmitting(false); return; }
    setSent(true);
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12" style={{ background: "var(--cc-bg)" }}>
      <AuthCard>
        <div className="flex items-center justify-center gap-2.5">
          <BrandIcon size={32} className="shrink-0" />
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--cc-title)" }}>ClearClause</span>
        </div>
        <h1 className="mt-5 text-center" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--cc-title)" }}>
          Reset your password
        </h1>
        <p className="mt-1.5 text-center text-[13px]" style={{ color: "var(--cc-muted)" }}>
          Enter your email and we&apos;ll send you a reset link.
        </p>
        <form className="mt-7 space-y-5" onSubmit={onSubmit} noValidate>
          <div>
            <AuthLabel htmlFor="fp-email">Email</AuthLabel>
            <AuthInput id="fp-email" name="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!emailError} aria-describedby={emailError ? "fp-email-err" : undefined} />
            {emailError ? (
              <p id="fp-email-err" className="mt-1.5 text-[12px]" style={{ color: "var(--cc-red)" }} role="alert">{emailError}</p>
            ) : null}
          </div>
          <Button type="submit" className="min-h-11 w-full rounded-[12px] text-[15px]" style={{ fontWeight: 590 }} disabled={submitting} aria-busy={submitting}>
            {submitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>
        <p className="mt-5 text-center text-[13px]" style={{ color: "var(--cc-auth-footer)" }}>
          Remember it?{" "}
          <Link to="/login" className="font-medium underline-offset-4 hover:underline" style={{ color: "var(--cc-auth-link)" }}>Sign in</Link>
        </p>
      </AuthCard>
    </div>
  );
}
