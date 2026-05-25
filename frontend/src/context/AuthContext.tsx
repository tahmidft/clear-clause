import type { Session, User } from "@supabase/supabase-js";
import * as React from "react";
import { authRedirectUrl, supabase } from "@/lib/supabase";

export interface AuthActionResult {
  error: string | null;
}

export interface SignUpResult extends AuthActionResult {
  needsEmailConfirmation: boolean;
  email: string | null;
}

function mapSignInError(message: string | undefined): string {
  const msg = message?.trim() ?? "";
  if (/email not confirmed/i.test(msg)) {
    return "Confirm your email first. Check your inbox and spam folder, then try again.";
  }
  if (msg) return msg;
  return "Those details do not match our records. Try again.";
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  resendConfirmation: (email: string) => Promise<AuthActionResult>;
  resetPassword: (email: string) => Promise<AuthActionResult>;
  updatePassword: (newPassword: string) => Promise<AuthActionResult>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = React.useCallback(async (email: string, password: string) => {
    const trimmed = email.trim();
    if (!trimmed || !password) {
      return { error: "Enter your email and password." };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: trimmed,
      password,
    });
    return { error: error ? mapSignInError(error.message) : null };
  }, []);

  const signUp = React.useCallback(async (email: string, password: string): Promise<SignUpResult> => {
    const trimmed = email.trim();
    if (!trimmed || !password) {
      return { error: "Enter your email and password.", needsEmailConfirmation: false, email: null };
    }
    if (password.length < 8) {
      return { error: "Password must be at least 8 characters.", needsEmailConfirmation: false, email: null };
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmed,
        password,
        options: {
          emailRedirectTo: authRedirectUrl("/login"),
        },
      });
      if (error) {
        const msg = error.message?.trim();
        return {
          error:
            msg ||
            "Sign up failed with no message from the server. Confirm VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env.",
          needsEmailConfirmation: false,
          email: null,
        };
      }
      // Supabase returns a stub user (empty identities) for duplicate emails to prevent enumeration.
      if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
        return {
          error:
            "An account with this email already exists. Sign in instead, or use password reset if you forgot your password.",
          needsEmailConfirmation: false,
          email: null,
        };
      }
      const needsEmailConfirmation = !data.session && !!data.user;
      return { error: null, needsEmailConfirmation, email: trimmed };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return {
        error: message || "Sign up failed unexpectedly.",
        needsEmailConfirmation: false,
        email: null,
      };
    }
  }, []);

  const resendConfirmation = React.useCallback(async (email: string) => {
    const trimmed = email.trim();
    if (!trimmed) {
      return { error: "Enter your email address." };
    }
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: trimmed,
      options: {
        emailRedirectTo: authRedirectUrl("/login"),
      },
    });
    return { error: error?.message ?? null };
  }, []);

  const resetPassword = React.useCallback(async (email: string): Promise<AuthActionResult> => {
    const trimmed = email.trim();
    if (!trimmed) {
      return { error: "Enter your email address." };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: authRedirectUrl("/update-password"),
    });
    return { error: error?.message ?? null };
  }, []);

  const updatePassword = React.useCallback(async (newPassword: string): Promise<AuthActionResult> => {
    if (!newPassword || newPassword.length < 8) {
      return { error: "Password must be at least 8 characters." };
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error?.message ?? null };
  }, []);

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      signIn,
      signUp,
      resendConfirmation,
      resetPassword,
      updatePassword,
      signOut,
    }),
    [session, loading, signIn, signUp, resendConfirmation, resetPassword, updatePassword, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
