import * as React from "react";

export const STORAGE_KEY = "clearclause-sidebar-open";

function readStoredOpen(): boolean | null {
  if (typeof sessionStorage === "undefined") return null;
  const v = sessionStorage.getItem(STORAGE_KEY);
  if (v === "open") return true;
  if (v === "closed") return false;
  return null;
}

function writeStoredOpen(open: boolean) {
  sessionStorage.setItem(STORAGE_KEY, open ? "open" : "closed");
}

export function clearSidebarPreference() {
  sessionStorage.removeItem(STORAGE_KEY);
}

type SidebarContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  expandOnLogin: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpenState] = React.useState(() => readStoredOpen() ?? true);

  const setOpen = React.useCallback((next: boolean) => {
    writeStoredOpen(next);
    setOpenState(next);
  }, []);

  const toggle = React.useCallback(() => {
    setOpenState((v) => {
      const next = !v;
      writeStoredOpen(next);
      return next;
    });
  }, []);

  const expandOnLogin = React.useCallback(() => {
    clearSidebarPreference();
    setOpenState(true);
  }, []);

  const value = React.useMemo(
    () => ({ open, setOpen, toggle, expandOnLogin }),
    [open, setOpen, toggle, expandOnLogin],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
