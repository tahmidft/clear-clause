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

function SidebarLabel({ collapsed, children }: { collapsed: boolean; children: React.ReactNode }) {
  return (
    <span
      aria-hidden={collapsed}
      style={{
        overflow: "hidden",
        whiteSpace: "nowrap",
        maxWidth: collapsed ? 0 : "12rem",
        opacity: collapsed ? 0 : 1,
        transition: "max-width 220ms ease, opacity 150ms ease",
        display: "block",
      }}
    >
      {children}
    </span>
  );
}

function SidebarNav({ onNavigate, collapsed }: { onNavigate?: () => void; collapsed?: boolean }) {
  const c = collapsed ?? false;
  return (
    <nav className="flex flex-col gap-0.5 p-2" aria-label="App navigation">
      {(
        [
          { to: "/dashboard", label: "My Contracts", Icon: LayoutDashboard },
          { to: "/settings",  label: "Settings",     Icon: Settings },
        ] as const
      ).map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className="flex min-h-[38px] items-center rounded-[10px] text-[14px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-accent)] select-none"
          style={({ isActive }) => ({
            background: isActive ? "var(--cc-nav-active-bg)" : undefined,
            color: isActive ? "var(--cc-nav-active-color)" : "var(--cc-nav-inactive-color)",
            padding: c ? "0" : "9px 10px",
            gap: c ? "0" : "10px",
            justifyContent: c ? "center" : undefined,
            width: c ? "2.25rem" : undefined,
            height: c ? "2.25rem" : undefined,
            transition: "background 150ms ease, padding 220ms ease, width 220ms ease",
          })}
          onMouseEnter={(e) => { if (!e.currentTarget.style.background.includes("nav-active")) { e.currentTarget.style.background = "var(--cc-nav-hover-bg)"; } }}
          onMouseLeave={(e) => {
            const isActive = e.currentTarget.getAttribute("aria-current") === "page";
            if (!isActive) e.currentTarget.style.background = "";
          }}
          onClick={onNavigate}
          title={c ? label : undefined}
          aria-label={label}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
          <SidebarLabel collapsed={c}>{label}</SidebarLabel>
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
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-accent)] transition-colors duration-200",
        className,
      )}
      style={{ color: "var(--cc-muted)", background: "transparent", border: "none", cursor: "pointer" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--cc-nav-hover-bg)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
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

  React.useEffect(() => {
    if (location.pathname.startsWith("/analysis/")) setOpen(false);
  }, [location.pathname, setOpen]);

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");
  const isDark = resolvedTheme === "dark";

  const sidebarContent = (opts: { isMobileSheet?: boolean; rail?: boolean }) => {
    const { isMobileSheet = false, rail = false } = opts;
    const iconOnly = rail && !isMobileSheet;

    return (
      <>
        {/* Header — always h-[52px], toggle button never moves */}
        <div
          className="flex h-[52px] shrink-0 items-center border-b"
          style={{ borderColor: "var(--cc-sidebar-border)", padding: "0 0.5rem" }}
        >
          {/* Logo — fades + clips as sidebar collapses */}
          <div
            className="flex min-w-0 flex-1 overflow-hidden"
            style={{
              maxWidth: iconOnly ? 0 : "100%",
              opacity: iconOnly ? 0 : 1,
              transition: "max-width 220ms ease, opacity 150ms ease",
              pointerEvents: iconOnly ? "none" : undefined,
            }}
          >
            <Link
              to="/dashboard"
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-accent)]"
              aria-label="ClearClause dashboard"
              tabIndex={iconOnly ? -1 : undefined}
            >
              <BrandIcon size={30} className="shrink-0" />
              <span
                className="truncate"
                style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--cc-title)", lineHeight: 1 }}
              >
                ClearClause
              </span>
            </Link>
          </div>

          {/* Toggle — fixed position, always visible */}
          {!isMobileSheet ? (
            <IconButton onClick={toggle} aria-label={open ? "Collapse sidebar" : "Expand sidebar"} className="shrink-0">
              {open ? <PanelLeftClose className="h-5 w-5" aria-hidden /> : <PanelLeft className="h-5 w-5" aria-hidden />}
            </IconButton>
          ) : (
            /* Mobile sheet: spacer so content doesn't crowd the right edge */
            <div className="w-2" />
          )}
        </div>

        <SidebarNav
          onNavigate={isMobileSheet ? () => setMobileOpen(false) : undefined}
          collapsed={iconOnly}
        />

        <div
          className="mt-auto flex flex-col gap-0.5 p-2"
          style={{ borderTop: "0.5px solid var(--cc-sidebar-border)" }}
        >
          {/* Email — fades out when collapsed */}
          <p
            className="truncate px-[10px] py-1"
            style={{
              fontSize: 12,
              color: "var(--cc-email-color)",
              maxHeight: iconOnly ? 0 : "2rem",
              opacity: iconOnly ? 0 : 1,
              overflow: "hidden",
              transition: "max-height 220ms ease, opacity 150ms ease",
              pointerEvents: iconOnly ? "none" : undefined,
            }}
            title={user?.email ?? ""}
            aria-hidden={iconOnly}
          >
            {user?.email}
          </p>

          {/* Theme toggle */}
          <button
            type="button"
            className="flex min-h-[38px] items-center rounded-[10px] text-[14px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-accent)]"
            style={{
              color: "var(--cc-nav-inactive-color)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: iconOnly ? "0" : "9px 10px",
              gap: iconOnly ? "0" : "10px",
              justifyContent: iconOnly ? "center" : undefined,
              width: iconOnly ? "2.25rem" : undefined,
              height: iconOnly ? "2.25rem" : undefined,
              transition: "background 150ms ease, padding 220ms ease, width 220ms ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--cc-nav-hover-bg)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            onClick={() => {
              if (isMobileSheet) setMobileOpen(false);
              toggleTheme();
            }}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={iconOnly ? (isDark ? "Light mode" : "Dark mode") : undefined}
          >
            {isDark ? (
              <Sun className="h-[18px] w-[18px] shrink-0" strokeWidth={2} aria-hidden />
            ) : (
              <Moon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} aria-hidden />
            )}
            <SidebarLabel collapsed={iconOnly}>{isDark ? "Light mode" : "Dark mode"}</SidebarLabel>
          </button>

          {/* Sign out */}
          <button
            type="button"
            className="flex min-h-[38px] items-center rounded-[10px] text-[14px] font-medium outline-none focus-visible:ring-2"
            style={{
              color: "var(--cc-sign-out-color)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: iconOnly ? "0" : "9px 10px",
              gap: iconOnly ? "0" : "10px",
              justifyContent: iconOnly ? "center" : undefined,
              width: iconOnly ? "2.25rem" : undefined,
              height: iconOnly ? "2.25rem" : undefined,
              transition: "background 150ms ease, padding 220ms ease, width 220ms ease",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,69,58,0.1)" : "rgba(255,59,48,0.08)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            onClick={async () => {
              if (isMobileSheet) setMobileOpen(false);
              await signOut();
              navigate("/login", { replace: true });
            }}
            aria-label="Sign out of ClearClause"
            title={iconOnly ? "Sign out" : undefined}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden />
            <SidebarLabel collapsed={iconOnly}>Sign out</SidebarLabel>
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-[100dvh]" style={{ background: "var(--cc-bg)", color: "var(--cc-title)" }}>
      <div className="flex min-h-[100dvh]">

        <aside
          className="fixed inset-y-0 left-0 z-40 hidden flex-col lg:flex"
          style={{
            width: open ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_COLLAPSED,
            transition: "width 220ms cubic-bezier(0.4, 0, 0.2, 1)",
            background: "var(--cc-sidebar-bg)",
            borderRight: "0.5px solid var(--cc-sidebar-border)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
          aria-label="Sidebar"
        >
          <div className={cn("relative flex h-full flex-col", collapsed && "items-center")}>
            {sidebarContent({ rail: collapsed })}
          </div>
        </aside>

        <div
          className={cn("flex flex-1 flex-col", open ? "lg:pl-64" : "lg:pl-[3.25rem]")}
          style={{ transition: "padding-left 220ms cubic-bezier(0.4, 0, 0.2, 1)" }}
        >
          {/* Mobile header */}
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
                className="w-[min(100%,320px)] flex flex-col border-r p-0"
                style={{
                  background: "var(--cc-sidebar-bg)",
                  borderRight: "0.5px solid var(--cc-sidebar-border)",
                }}
                aria-describedby={undefined}
              >
                <SheetHeader
                  className="p-4 text-left"
                  style={{ borderBottom: "0.5px solid var(--cc-sidebar-border)" }}
                >
                  <SheetTitle className="flex items-center gap-2.5">
                    <BrandIcon size={28} className="shrink-0" />
                    <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--cc-title)" }}>
                      ClearClause
                    </span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-1 flex-col overflow-y-auto">
                  {sidebarContent({ isMobileSheet: true })}
                </div>
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
