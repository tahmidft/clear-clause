import * as React from "react";
import { getPreferences } from "@/lib/api";
import type { PreferenceRecord } from "@/types";
import { useAuth } from "@/context/AuthContext";

interface PreferencesContextValue {
  preferences: PreferenceRecord | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const PreferencesContext = React.createContext<PreferencesContextValue | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [preferences, setPreferences] = React.useState<PreferenceRecord | null>(null);
  const [loading, setLoading] = React.useState(false);

  const refresh = React.useCallback(async () => {
    if (!user) {
      setPreferences(null);
      return;
    }
    setLoading(true);
    try {
      const p = await getPreferences();
      setPreferences(p);
    } catch {
      setPreferences(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    if (authLoading) return;
    void refresh();
  }, [user, authLoading, refresh]);

  const value = React.useMemo(
    () => ({
      preferences,
      loading,
      refresh,
    }),
    [preferences, loading, refresh],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const ctx = React.useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return ctx;
}
