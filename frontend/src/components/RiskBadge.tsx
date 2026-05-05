import { AlertTriangle, ShieldCheck, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types";

const config: Record<
  RiskLevel,
  { label: string; Icon: typeof ShieldCheck; className: string }
> = {
  safe: {
    label: "Safe",
    Icon: ShieldCheck,
    className: "border-[var(--color-green)]/30 bg-[var(--color-green)]/15 text-[var(--color-green)]",
  },
  caution: {
    label: "Caution",
    Icon: AlertTriangle,
    className: "border-[var(--color-yellow)]/35 bg-[var(--color-yellow)]/18 text-[var(--color-yellow)]",
  },
  red_flag: {
    label: "Red Flag",
    Icon: XCircle,
    className: "border-[var(--color-red)]/30 bg-[var(--color-red)]/12 text-[var(--color-red)]",
  },
};

interface RiskBadgeProps {
  level: RiskLevel;
  className?: string;
}

export function RiskBadge({ level, className }: RiskBadgeProps) {
  const { label, Icon, className: tone } = config[level];
  return (
    <span
      className={cn(
        "inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium",
        tone,
        className,
      )}
      role="status"
      aria-label={`Risk level: ${label}`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span>{label}</span>
    </span>
  );
}
