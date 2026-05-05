import * as React from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { FileText, LayoutDashboard, LogOut, Menu, Moon, PanelLeft, Settings, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { useWakeServer } from "@/hooks/useWakeServer";
import { cn } from "@/lib/utils";

function WakeBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="border-b border-[var(--color-yellow)]/40 bg-[var(--color-yellow)]/15 px-4 py-3 text-center text-[17px] text-[var(--color-label)] dark:text-[var(--color-label)]"
      role="status"
      aria-live="polite"
    >
      Server is waking up, this may take 30 seconds...
    </div>
  );
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex min-h-11 min-w-11 items-center gap-3 rounded-[10px] px-3 py-2 text-[17px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-blue)]",
    isActive
      ? "bg-[var(--color-blue)]/10 font-medium text-[var(--color-blue)]"
      : "text-[var(--color-secondary)] hover:bg-[var(--color-bg)] dark:hover:bg-white/5",
  );

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 p-3" aria-label="App navigation">
      <NavLink to="/dashboard" className={navClass} onClick={onNavigate} aria-label="My contracts dashboard">
        <LayoutDashboard className="h-5 w-5 shrink-0" aria-hidden />
        <span>My Contracts</span>
      </NavLink>
      <NavLink to="/settings" className={navClass} onClick={onNavigate} aria-label="Account and preferences settings">
        <Settings className="h-5 w-5 shrink-0" aria-hidden />
        <span>Settings</span>
      </NavLink>
    </nav>
  );
}

export function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { setTheme, resolvedTheme } = useTheme();
  const { isWaking } = useWakeServer();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-label)]">
      <WakeBanner visible={isWaking} />
      <div className="flex min-h-[calc(100vh-0px)]">
        <aside
          className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[var(--color-separator)] bg-[var(--color-surface)] shadow-[0_2px_8px_rgba(0,0,0,0.08)] lg:flex"
          aria-label="Sidebar"
        >
          <div className="flex h-14 items-center gap-2 border-b border-[var(--color-separator)] px-4">
            <FileText className="h-6 w-6 text-[var(--color-blue)]" aria-hidden />
            <span className="font-display text-lg font-semibold">ClearClause</span>
          </div>
          <SidebarNav />
          <div className="mt-auto border-t border-[var(--color-separator)] p-3">
            <p className="truncate px-3 text-sm text-[var(--color-secondary)]" title={user?.email ?? ""}>
              {user?.email}
            </p>
            <Button
              variant="ghost"
              className="mt-1 min-h-11 w-full justify-start gap-2 rounded-[10px] text-[var(--color-red)] hover:bg-[var(--color-red)]/10 hover:text-[var(--color-red)]"
              type="button"
              onClick={async () => {
                await signOut();
                navigate("/login", { replace: true });
              }}
              aria-label="Sign out of ClearClause"
            >
              <LogOut className="h-5 w-5" aria-hidden />
              Sign out
            </Button>
          </div>
        </aside>

        <div className="flex flex-1 flex-col lg:pl-64">
          <div className="flex h-14 items-center justify-between border-b border-[var(--color-separator)] bg-[var(--color-surface)] px-3 lg:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="min-h-11 min-w-11 shrink-0"
                  aria-label="Open navigation menu"
                >
                  <Menu className="h-6 w-6" aria-hidden />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(100%,320px)] p-0" aria-describedby={undefined}>
                <SheetHeader className="border-b border-[var(--color-separator)] p-4 text-left">
                  <SheetTitle className="flex items-center gap-2 font-display text-lg">
                    <PanelLeft className="h-5 w-5" aria-hidden />
                    Menu
                  </SheetTitle>
                </SheetHeader>
                <SidebarNav onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            <Link to="/dashboard" className="font-display text-lg font-semibold" aria-label="Dashboard home">
              ClearClause
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="min-h-11 min-w-11"
              type="button"
              onClick={toggleTheme}
              aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {resolvedTheme === "dark" ? <Sun className="h-5 w-5" aria-hidden /> : <Moon className="h-5 w-5" aria-hidden />}
            </Button>
          </div>

          <div className="hidden items-center justify-end gap-2 border-b border-[var(--color-separator)] bg-[var(--color-surface)] px-6 py-2 lg:flex">
            <Button
              variant="outline"
              size="sm"
              className="min-h-11 rounded-[10px]"
              type="button"
              onClick={toggleTheme}
              aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {resolvedTheme === "dark" ? (
                <>
                  <Sun className="mr-2 h-4 w-4" aria-hidden />
                  Light
                </>
              ) : (
                <>
                  <Moon className="mr-2 h-4 w-4" aria-hidden />
                  Dark
                </>
              )}
            </Button>
          </div>

          <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8" tabIndex={-1}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
