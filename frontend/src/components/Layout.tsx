import * as React from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, Menu, Moon, PanelLeft, PanelLeftClose, Settings, Sun } from "lucide-react";
import { BrandIcon } from "@/components/BrandLogo";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const SIDEBAR_WIDTH_OPEN = "16rem";
const SIDEBAR_WIDTH_COLLAPSED = "3.25rem";
const SIDEBAR_TRANSITION_MS = 240;

function useSidebarLabelsVisible(open: boolean): boolean {
  const [labelsVisible, setLabelsVisible] = React.useState(open);

  React.useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => setLabelsVisible(true), SIDEBAR_TRANSITION_MS);
      return () => window.clearTimeout(id);
    }
    setLabelsVisible(false);
  }, [open]);

  return labelsVisible;
}

function SidebarNav({
  onNavigate,
  collapsed,
  labelsVisible,
  largeTouch,
}: {
  onNavigate?: () => void;
  collapsed: boolean;
  labelsVisible: boolean;
  largeTouch?: boolean;
}) {
  return (
    <nav className="flex flex-col gap-0.5 p-2" aria-label="App navigation">
      {(
        [
          { to: "/dashboard", label: "My Contracts", Icon: LayoutDashboard },
          { to: "/settings", label: "Settings", Icon: Settings },
        ] as const
      ).map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={cn(
            "flex items-center rounded-[10px] text-[14px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-accent)] select-none",
            collapsed ? "h-9 w-9 justify-center" : largeTouch ? "min-h-11 gap-2.5 px-2.5" : "h-9 gap-2.5 px-2.5",
          )}
          style={({ isActive }) => ({
            background: isActive ? "var(--cc-nav-active-bg)" : undefined,
            color: isActive ? "var(--cc-nav-active-color)" : "var(--cc-nav-inactive-color)",
          })}
          onMouseEnter={(e) => {
            if (!e.currentTarget.style.background.includes("nav-active")) {
              e.currentTarget.style.background = "var(--cc-nav-hover-bg)";
            }
          }}
          onMouseLeave={(e) => {
            const isActive = e.currentTarget.getAttribute("aria-current") === "page";
            if (!isActive) e.currentTarget.style.background = "";
          }}
          onClick={onNavigate}
          title={collapsed ? label : undefined}
          aria-label={label}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
          {!collapsed && labelsVisible ? (
            <span className="truncate">{label}</span>
          ) : null}
        </NavLink>
      ))}
    </nav>
  );
}

function IconButton({
  onClick,
  "aria-label": ariaLabel,
  children,
  className,
}: {
  onClick: () => void;
  "aria-label": string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-accent)]",
        className,
      )}
      style={{ color: "var(--cc-muted)", background: "transparent", border: "none", cursor: "pointer" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "var(--cc-nav-hover-bg)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

function LayoutShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { setTheme, resolvedTheme } = useTheme();
  const { open, toggle, setOpen } = useSidebar();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const collapsed = !open;
  const labelsVisible = useSidebarLabelsVisible(open);

  React.useEffect(() => {
    if (location.pathname.startsWith("/analysis/")) setOpen(false);
  }, [location.pathname, setOpen]);

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");
  const isDark = resolvedTheme === "dark";

  const sidebarContent = (opts: { isMobileSheet?: boolean }) => {
    const { isMobileSheet = false } = opts;
    const rail = collapsed && !isMobileSheet;
    const largeTouch = isMobileSheet;

    return (
      <>
        <div
          className={cn(
            "flex h-[52px] shrink-0 items-center border-b",
            rail ? "justify-center px-2" : "justify-between gap-2 px-3",
          )}
          style={{ borderColor: "var(--cc-sidebar-border)" }}
        >
          {!rail ? (
            <Link
              to="/dashboard"
              className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-accent)]"
              aria-label="ClearClause dashboard"
            >
              <BrandIcon size={30} className="shrink-0" />
              {labelsVisible ? (
                <span
                  className="truncate"
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    color: "var(--cc-title)",
                    lineHeight: 1,
                  }}
                >
                  ClearClause
                </span>
              ) : null}
            </Link>
          ) : null}

          {!isMobileSheet ? (
            <IconButton onClick={toggle} aria-label={open ? "Collapse sidebar" : "Expand sidebar"}>
              {open ? <PanelLeftClose className="h-5 w-5" aria-hidden /> : <PanelLeft className="h-5 w-5" aria-hidden />}
            </IconButton>
          ) : null}
        </div>

        <SidebarNav
          onNavigate={isMobileSheet ? () => setMobileOpen(false) : undefined}
          collapsed={rail}
          labelsVisible={labelsVisible}
          largeTouch={largeTouch}
        />

        <div className="mt-auto flex flex-col gap-0.5 p-2" style={{ borderTop: "0.5px solid var(--cc-sidebar-border)" }}>
          {!rail && labelsVisible ? (
            <p
              className="truncate px-2.5 py-1"
              style={{ fontSize: 12, color: "var(--cc-email-color)" }}
              title={user?.email ?? ""}
            >
              {user?.email}
            </p>
          ) : null}

          <button
            type="button"
            className={cn(
              "flex items-center rounded-[10px] text-[14px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-accent)]",
              rail ? "h-9 w-9 justify-center" : largeTouch ? "min-h-11 gap-2.5 px-2.5" : "h-9 gap-2.5 px-2.5",
            )}
            style={{ color: "var(--cc-nav-inactive-color)", background: "transparent", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--cc-nav-hover-bg)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
            onClick={() => {
              if (isMobileSheet) setMobileOpen(false);
              toggleTheme();
            }}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={rail ? (isDark ? "Light mode" : "Dark mode") : undefined}
          >
            {isDark ? <Sun className="h-[18px] w-[18px] shrink-0" strokeWidth={2} aria-hidden /> : <Moon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} aria-hidden />}
            {!rail && labelsVisible ? <span>{isDark ? "Light mode" : "Dark mode"}</span> : null}
          </button>

          <button
            type="button"
            className={cn(
              "flex items-center rounded-[10px] text-[14px] font-medium outline-none focus-visible:ring-2",
              rail ? "h-9 w-9 justify-center" : largeTouch ? "min-h-11 gap-2.5 px-2.5" : "h-9 gap-2.5 px-2.5",
            )}
            style={{ color: "var(--cc-sign-out-color)", background: "transparent", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,69,58,0.1)" : "rgba(255,59,48,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
            onClick={async () => {
              if (isMobileSheet) setMobileOpen(false);
              await signOut();
              navigate("/login", { replace: true });
            }}
            aria-label="Sign out of ClearClause"
            title={rail ? "Sign out" : undefined}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden />
            {!rail && labelsVisible ? <span>Sign out</span> : null}
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-[100dvh]" style={{ background: "var(--cc-bg)", color: "var(--cc-title)" }}>
      <div className="flex min-h-[100dvh]">
        <aside
          className="fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden lg:flex"
          style={{
            width: open ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_COLLAPSED,
            transition: `width ${SIDEBAR_TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            background: "var(--cc-sidebar-bg)",
            borderRight: "0.5px solid var(--cc-sidebar-border)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
          aria-label="Sidebar"
        >
          <div className="flex h-full flex-col">{sidebarContent({})}</div>
        </aside>

        <div
          className={cn("flex flex-1 flex-col", open ? "lg:pl-64" : "lg:pl-[3.25rem]")}
          style={{ transition: `padding-left ${SIDEBAR_TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)` }}
        >
          <div
            className="safe-top flex h-[52px] min-h-[44px] items-center justify-between px-3 sm:px-4 lg:hidden"
            style={{
              background: "var(--cc-sidebar-bg)",
              borderBottom: "0.5px solid var(--cc-sidebar-border)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-accent)]"
                  style={{ color: "var(--cc-muted)", background: "transparent", border: "none", cursor: "pointer" }}
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-6 w-6" aria-hidden />
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="flex w-[min(100%,320px)] flex-col border-r p-0"
                style={{
                  background: "var(--cc-sidebar-bg)",
                  borderRight: "0.5px solid var(--cc-sidebar-border)",
                }}
                aria-describedby={undefined}
              >
                <SheetHeader className="p-4 text-left" style={{ borderBottom: "0.5px solid var(--cc-sidebar-border)" }}>
                  <SheetTitle className="flex items-center gap-2.5">
                    <BrandIcon size={28} className="shrink-0" />
                    <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--cc-title)" }}>
                      ClearClause
                    </span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-1 flex-col overflow-y-auto">{sidebarContent({ isMobileSheet: true })}</div>
              </SheetContent>
            </Sheet>

            <Link
              to="/dashboard"
              className="inline-flex min-h-11 min-w-0 max-w-[60%] items-center gap-2.5 truncate rounded-md px-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-accent)]"
              aria-label="Dashboard home"
            >
              <BrandIcon size={28} className="shrink-0" />
              <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--cc-title)" }}>
                ClearClause
              </span>
            </Link>

            <div className="w-11 shrink-0" aria-hidden />
          </div>

          <main
            id="main-content"
            className="safe-bottom min-w-0 flex-1 overflow-x-hidden p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6 lg:p-8"
            tabIndex={-1}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

export function Layout() {
  return (
    <SidebarProvider>
      <LayoutShell />
    </SidebarProvider>
  );
}
