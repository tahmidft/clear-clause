import * as React from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

type PageState = "waiting" | "ready" | "invalid" | "success";

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

export default function UpdatePassword() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const [pageState, setPageState] = React.useState<PageState>("waiting");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [passwordError, setPasswordError] = React.useState("");
  const [confirmError, setConfirmError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let invalidTimer: ReturnType<typeof setTimeout> | null = null;
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        if (invalidTimer) { clearTimeout(invalidTimer); invalidTimer = null; }
        setPageState("ready");
      }
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setPageState((prev) => (prev === "waiting" ? "ready" : prev));
      } else {
        invalidTimer = setTimeout(() => {
          setPageState((prev) => (prev === "waiting" ? "invalid" : prev));
        }, 3000);
      }
    });
    return () => {
      sub.subscription.unsubscribe();
      if (invalidTimer) clearTimeout(invalidTimer);
    };
  }, []);

  const validate = (): boolean => {
    let ok = true;
    setPasswordError(""); setConfirmError("");
    if (password.length < 8) { setPasswordError("Use at least 8 characters for your password."); ok = false; }
    if (password !== confirmPassword) { setConfirmError("Passwords do not match."); ok = false; }
    return ok;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const { error } = await updatePassword(password);
    if (error) { setPasswordError(error); setSubmitting(false); return; }
    await supabase.auth.signOut();
    setPageState("success");
    setSubmitting(false);
  };

  if (pageState === "waiting") {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--cc-bg)" }} role="status" aria-live="polite" aria-label="Loading">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--cc-accent)" }} aria-hidden />
      </div>
    );
  }

  if (pageState === "invalid") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12" style={{ background: "var(--cc-bg)" }}>
        <AuthCard>
          <h1 className="text-center" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--cc-title)" }}>
            Link expired
          </h1>
          <p className="mt-3 text-center text-[13px]" style={{ color: "var(--cc-muted)" }}>
            This password reset link is invalid or has expired. Request a new one below.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Button type="button" className="min-h-11 w-full rounded-[12px] text-[15px]" onClick={() => navigate("/forgot-password", { replace: true })}>
              Request new reset link
            </Button>
            <Button type="button" variant="outline" className="min-h-11 w-full rounded-[12px] text-[15px]" onClick={() => navigate("/login", { replace: true })}>
              Back to sign in
            </Button>
          </div>
        </AuthCard>
      </div>
    );
  }

  if (pageState === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12" style={{ background: "var(--cc-bg)" }}>
        <AuthCard>
          <div className="flex justify-center">
            <div
              className="flex items-center justify-center rounded-[14px]"
              style={{ width: 52, height: 52, background: "var(--cc-accept-bg)", border: "0.5px solid var(--cc-accept-border)" }}
            >
              <CheckCircle className="h-6 w-6" style={{ color: "var(--cc-green)" }} aria-hidden />
            </div>
          </div>
          <h1 className="mt-4 text-center" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--cc-title)" }}>
            Password updated
          </h1>
          <p className="mt-3 text-center text-[13px]" style={{ color: "var(--cc-muted)" }}>
            Your password has been changed. Sign in with your new password to continue.
          </p>
          <div className="mt-6">
            <Button type="button" className="min-h-11 w-full rounded-[12px] text-[15px]" onClick={() => navigate("/login", { replace: true })}>
              Sign in
            </Button>
          </div>
        </AuthCard>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12" style={{ background: "var(--cc-bg)" }}>
      <AuthCard>
        <h1 className="text-center" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--cc-title)" }}>
          Choose a new password
        </h1>
        <p className="mt-1.5 text-center text-[13px]" style={{ color: "var(--cc-muted)" }}>
          Use at least 8 characters.
        </p>
        <form className="mt-7 space-y-5" onSubmit={onSubmit} noValidate>
          <div>
            <AuthLabel htmlFor="up-password">New password</AuthLabel>
            <AuthInput id="up-password" name="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!passwordError} aria-describedby={passwordError ? "up-pw-err" : undefined} />
            {passwordError ? <p id="up-pw-err" className="mt-1.5 text-[12px]" style={{ color: "var(--cc-red)" }} role="alert">{passwordError}</p> : null}
          </div>
          <div>
            <AuthLabel htmlFor="up-confirm">Confirm new password</AuthLabel>
            <AuthInput id="up-confirm" name="confirmPassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} aria-invalid={!!confirmError} aria-describedby={confirmError ? "up-confirm-err" : undefined} />
            {confirmError ? <p id="up-confirm-err" className="mt-1.5 text-[12px]" style={{ color: "var(--cc-red)" }} role="alert">{confirmError}</p> : null}
          </div>
          <Button type="submit" className="min-h-11 w-full rounded-[12px] text-[15px]" style={{ fontWeight: 590 }} disabled={submitting} aria-busy={submitting}>
            {submitting ? "Updating…" : "Update password"}
          </Button>
        </form>
      </AuthCard>
    </div>
  );
}
