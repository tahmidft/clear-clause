import * as React from "react";

const STORAGE_KEY = "clearclause-sidebar-open";

type SidebarContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Default expanded; persistence only applies after the user toggles collapse.
  const [open, setOpen] = React.useState(true);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, open ? "open" : "closed");
  }, [open]);

  const toggle = React.useCallback(() => setOpen((v) => !v), []);

  const value = React.useMemo(() => ({ open, setOpen, toggle }), [open, toggle]);

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
