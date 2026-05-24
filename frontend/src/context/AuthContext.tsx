import type { Session, User } from "@supabase/supabase-js";
import * as React from "react";
import { supabase } from "@/lib/supabase";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
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
    return { error: error?.message ?? null };
  }, []);

  const signUp = React.useCallback(async (email: string, password: string) => {
    const trimmed = email.trim();
    if (!trimmed || !password) {
      return { error: "Enter your email and password." };
    }
    if (password.length < 8) {
      return { error: "Password must be at least 8 characters." };
    }
    try {
      const { error } = await supabase.auth.signUp({
        email: trimmed,
        password,
      });
      if (!error) return { error: null };
      const msg = error.message?.trim();
      return {
        error:
          msg ||
          "Sign up failed with no message from the server. Confirm VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env.",
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return { error: message || "Sign up failed unexpectedly." };
    }
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
      signOut,
    }),
    [session, loading, signIn, signUp, signOut],
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
