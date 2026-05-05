import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface NavbarProps {
  rightSlot?: React.ReactNode;
}

export function Navbar({ rightSlot }: NavbarProps) {
  return (
    <header
      className="sticky top-0 z-50 border-b border-[var(--color-separator)] bg-[var(--color-surface)]/90 backdrop-blur-md dark:bg-[var(--color-surface)]/90"
      role="banner"
    >
      <div className="mx-auto flex h-14 min-h-[44px] max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          className="flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-md px-2 text-[var(--color-label)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-blue)]"
          aria-label="ClearClause home"
        >
          <FileText className="h-6 w-6 text-[var(--color-blue)]" aria-hidden />
          <span className="font-display text-lg font-semibold tracking-tight">ClearClause</span>
        </Link>
        <nav className="flex items-center gap-2" aria-label="Primary">
          {rightSlot ?? (
            <Button asChild variant="default" className="min-h-11 rounded-[10px] px-5" aria-label="Sign in to your account">
              <Link to="/login">Sign In</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
