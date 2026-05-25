import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BrandIcon } from "@/components/BrandLogo";

interface NavbarProps {
  rightSlot?: React.ReactNode;
}

export function Navbar({ rightSlot }: NavbarProps) {
  return (
    <header
      className="safe-top sticky top-0 z-50"
      style={{
        background: "var(--cc-sidebar-bg)",
        borderBottom: "0.5px solid var(--cc-sidebar-border)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
      }}
      role="banner"
    >
      <div className="mx-auto flex h-[52px] min-h-[44px] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          to="/"
          className="flex min-h-[44px] min-w-[44px] items-center gap-2.5 rounded-md px-1.5 outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-accent)]"
          aria-label="ClearClause home"
        >
          <BrandIcon size={28} className="shrink-0" />
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--cc-title)" }}>
            ClearClause
          </span>
        </Link>
        <nav className="flex items-center gap-2" aria-label="Primary">
          {rightSlot ?? (
            <Button asChild size="sm" className="shrink-0 rounded-[8px]" aria-label="Sign in to your account">
              <Link to="/login">Sign In</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
