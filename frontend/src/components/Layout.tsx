import * as React from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, Menu, Moon, PanelLeft, PanelLeftClose, Settings, Sun } from "lucide-react";
import { BrandIcon } from "@/components/BrandLogo";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { useWakeServer } from "@/hooks/useWakeServer";
import { cn } from "@/lib/utils";

function WakeBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="border-b px-4 py-2.5 text-center text-[13px]"
      style={{
        borderColor: "rgba(255,159,10,0.4)",
        background: "rgba(255,159,10,0.1)",
        color: "var(--cc-body)",
      }}
      role="status"
      aria-live="polite"
    >
      Server is waking up, this may take 30 seconds…
    </div>
  );
}

/** Applies hover/active background imperatively to avoid per-item state */
function useNavHover() {
  const enter = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    if (!el.dataset.active) el.style.background = "var(--cc-nav-hover-bg)";
  };
  const leave = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    if (!el.dataset.active) el.style.background = "";
  };
  return { onMouseEnter: enter, onMouseLeave: leave };
}

function SidebarNav({ onNavigate, collapsed }: { onNavigate?: () => void; collapsed?: boolean }) {
  const hov = useNavHover();

  return (
    <nav className="flex flex-col gap-0.5 p-3" aria-label="App navigation">
      {(
        [
          { to: "/dashboard", label: "My Contracts", Icon: LayoutDashboard },
          { to: "/settings",  label: "Settings",     Icon: Settings },
        ] as const
      ).map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className="flex min-h-[38px] items-center gap-2.5 rounded-[10px] px-[10px] py-[9px] text-[14px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-accent)] select-none transition-colors duration-200"
          style={({ isActive }) => ({
            background: isActive ? "var(--cc-nav-active-bg)" : undefined,
            color: isActive ? "var(--cc-nav-active-color)" : "var(--cc-nav-inactive-color)",
          })}
          onMouseEnter={(e) => { if (!e.currentTarget.style.background.includes("nav-active")) { e.currentTarget.style.background = "var(--cc-nav-hover-bg)"; } }}
          onMouseLeave={(e) => {
            const isActive = e.currentTarget.getAttribute("aria-current") === "page";
            if (!isActive) e.currentTarget.style.background = "";
          }}
          onClick={onNavigate}
          title={collapsed ? label : undefined}
          aria-label={label}
        >
          <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
          {!collapsed ? <span>{label}</span> : null}
        </NavLink>
      ))}
    </nav>
  );
}

function IconButton({
  onClick,
  "aria-label": ariaLabel,
  children,
}: {
  onClick: () => void;
  "aria-label": string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-accent)] transition-colors duration-200"
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
  const { isWaking } = useWakeServer();
  const { open, toggle, setOpen } = useSidebar();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    if (location.pathname.startsWith("/analysis/")) setOpen(false);
  }, [location.pathname, setOpen]);

  const toggleTheme = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");
  const isDark = resolvedTheme === "dark";

  const sidebarContent = (isMobileSheet = false) => (
    <>
      {/* Logo header */}
      <div
        className="flex h-[52px] min-w-[16rem] items-center justify-between gap-2 px-3"
        style={{ borderBottom: "0.5px solid var(--cc-sidebar-border)" }}
      >
        <Link
          to="/dashboard"
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-accent)]"
          aria-label="ClearClause dashboard"
        >
          <BrandIcon size={30} className="shrink-0" />
          <span
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
        </Link>
        {!isMobileSheet && (
          <IconButton onClick={toggle} aria-label="Close sidebar">
            <PanelLeftClose className="h-5 w-5" aria-hidden />
          </IconButton>
        )}
      </div>

      {/* Nav */}
      <SidebarNav onNavigate={isMobileSheet ? () => setMobileOpen(false) : undefined} />

      {/* Footer */}
      <div
        className="mt-auto min-w-[16rem] p-3"
        style={{ borderTop: "0.5px solid var(--cc-sidebar-border)" }}
      >
        <p
          className="truncate px-[10px] py-1"
          style={{ fontSize: 12, color: "var(--cc-email-color)" }}
          title={user?.email ?? ""}
        >
          {user?.email}
        </p>
        <button
          type="button"
          className="mt-1 flex w-full min-h-[38px] items-center gap-2.5 rounded-[10px] px-[10px] py-[9px] text-[14px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-accent)] transition-colors duration-200"
          style={{
            color: "var(--cc-nav-inactive-color)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--cc-nav-hover-bg)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          onClick={() => {
            if (isMobileSheet) setMobileOpen(false);
            toggleTheme();
          }}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? (
            <Sun className="h-[18px] w-[18px] shrink-0" strokeWidth={2} aria-hidden />
          ) : (
            <Moon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} aria-hidden />
          )}
          {isDark ? "Light mode" : "Dark mode"}
        </button>
        <button
          type="button"
          className="mt-0.5 flex w-full min-h-[38px] items-center gap-2.5 rounded-[10px] px-[10px] py-[9px] text-[14px] font-medium outline-none focus-visible:ring-2 transition-colors duration-200"
          style={{
            color: "var(--cc-sign-out-color)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = isDark ? "rgba(255,69,58,0.1)" : "rgba(255,59,48,0.08)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          onClick={async () => {
            if (isMobileSheet) setMobileOpen(false);
            await signOut();
            navigate("/login", { replace: true });
          }}
          aria-label="Sign out of ClearClause"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-[100dvh]" style={{ background: "var(--cc-bg)", color: "var(--cc-title)" }}>
      <WakeBanner visible={isWaking} />
      <div className="flex min-h-[100dvh]">

        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 hidden flex-col lg:flex",
            "transition-[width] duration-200 ease-out",
            open ? "w-64" : "w-0 overflow-hidden",
          )}
          style={{
            background: "var(--cc-sidebar-bg)",
            borderRight: "0.5px solid var(--cc-sidebar-border)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
          aria-label="Sidebar"
          aria-hidden={!open}
        >
          {sidebarContent(false)}
        </aside>

        {/* Main content */}
        <div className={cn("flex flex-1 flex-col transition-[padding] duration-200 ease-out", open ? "lg:pl-64" : "lg:pl-0")}>

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
                  {sidebarContent(true)}
                </div>
              </SheetContent>
            </Sheet>

            <Link
              to="/dashboard"
              className="inline-flex min-h-11 min-w-0 max-w-[50%] items-center gap-2.5 truncate rounded-md px-1 outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-accent)]"
              aria-label="Dashboard home"
            >
              <BrandIcon size={28} className="shrink-0" />
              <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--cc-title)" }}>
                ClearClause
              </span>
            </Link>

            <IconButton onClick={toggleTheme} aria-label="Toggle theme">
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </IconButton>
          </div>

          {/* Desktop top bar — only when sidebar is closed */}
          {!open ? (
            <div
              className="hidden h-[52px] items-center justify-between px-3 lg:flex"
              style={{
                background: "var(--cc-sidebar-bg)",
                borderBottom: "0.5px solid var(--cc-sidebar-border)",
                backdropFilter: "blur(20px)",
              }}
            >
              <IconButton onClick={() => setOpen(true)} aria-label="Open sidebar">
                <PanelLeft className="h-5 w-5" aria-hidden />
              </IconButton>
              <IconButton onClick={toggleTheme} aria-label="Toggle theme">
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </IconButton>
            </div>
          ) : null}

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
