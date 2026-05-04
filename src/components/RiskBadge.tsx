import { CheckCircle2, AlertTriangle, AlertOctagon } from "lucide-react";
import { RiskLevel, riskCopy } from "@/lib/mockData";
import { cn } from "@/lib/utils";

export function RiskBadge({ risk, className }: { risk: RiskLevel; className?: string }) {
  const { label, tone } = riskCopy(risk);
  const Icon = risk === "safe" ? CheckCircle2 : risk === "caution" ? AlertTriangle : AlertOctagon;
  const styles =
    tone === "success"
      ? "bg-success/10 text-success border-success/20"
      : tone === "warning"
      ? "bg-warning/15 text-[hsl(var(--warning))] border-warning/30"
      : "bg-destructive/10 text-destructive border-destructive/20";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        styles,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span>{label}</span>
    </span>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const tone = score >= 75 ? "success" : score >= 50 ? "warning" : "destructive";
  const styles =
    tone === "success"
      ? "bg-success/10 text-success border-success/20"
      : tone === "warning"
      ? "bg-warning/15 text-[hsl(var(--warning))] border-warning/30"
      : "bg-destructive/10 text-destructive border-destructive/20";
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", styles)}>
      Score {score}
    </span>
  );
}