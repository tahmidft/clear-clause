import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] px-4 text-center">
      <h1 className="font-display text-[34px] font-semibold text-[var(--color-label)]">Page not found</h1>
      <p className="mt-3 max-w-md text-[17px] text-[var(--color-secondary)]">
        The page you are looking for does not exist or has been moved.
      </p>
      <Button asChild className="mt-8 min-h-11 rounded-[10px] px-8">
        <Link to="/" aria-label="Return to ClearClause home">
          Return home
        </Link>
      </Button>
    </div>
  );
}
