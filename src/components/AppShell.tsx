import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { FileText, LayoutDashboard, Settings as SettingsIcon, Upload, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/dashboard", label: "Contracts", icon: LayoutDashboard },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function AppShell() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top nav (desktop) */}
      <header className="glass sticky top-0 z-40 border-b border-border">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-8">
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
            <span>ClearClause</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  cn(
                    "inline-flex h-11 items-center gap-2 rounded-full px-4 text-[15px] font-medium transition-colors",
                    isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60",
                  )
                }
              >
                <n.icon className="h-4 w-4" aria-hidden />
                {n.label}
              </NavLink>
            ))}
          </nav>
          <Button asChild size="sm" className="hidden h-10 rounded-full px-4 md:inline-flex">
            <Link to="/upload"><Upload className="mr-1.5 h-4 w-4" />New analysis</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 md:px-8 md:pt-10">
        <Outlet />
      </main>

      {/* Bottom tab bar (mobile / iPad portrait) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/90 backdrop-blur md:hidden"
        aria-label="Mobile primary"
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 py-2">
          {nav.map((n) => {
            const active = pathname.startsWith(n.to);
            return (
              <li key={n.to} className="flex-1">
                <Link
                  to={n.to}
                  className={cn(
                    "flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-xs",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <n.icon className="h-5 w-5" aria-hidden />
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}