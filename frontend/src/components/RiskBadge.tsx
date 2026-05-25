import { ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import type { RiskLevel } from "@/types";

interface RiskBadgeConfig {
  label: string;
  Icon: typeof ShieldCheck;
  bg: string;
  border: string;
  color: string;
}

const config: Record<RiskLevel, RiskBadgeConfig> = {
  safe: {
    label: "Safe",
    Icon: ShieldCheck,
    bg: "var(--cc-accept-bg)",
    border: "1px solid var(--cc-accept-border)",
    color: "var(--cc-accept-color)",
  },
  caution: {
    label: "Caution",
    Icon: ShieldQuestion,
    bg: "rgba(255,149,0,0.08)",
    border: "1px solid rgba(255,149,0,0.22)",
    color: "var(--cc-orange)",
  },
  red_flag: {
    label: "Red flag",
    Icon: ShieldAlert,
    bg: "var(--cc-reject-bg)",
    border: "1px solid var(--cc-reject-border)",
    color: "var(--cc-reject-color)",
  },
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  const { label, Icon, bg, border, color } = config[level] ?? config.caution;
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1"
      style={{ fontSize: 11, fontWeight: 600, background: bg, border, color, letterSpacing: "-0.01em" }}
      aria-label={`Risk level: ${label}`}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      {label}
    </span>
  );
}
