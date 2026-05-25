import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScamAlertProps {
  likelyScam?: boolean | null;
  scamRisk?: "high" | "medium" | "low" | null;
  scamSignals?: string[] | null;
  compact?: boolean;
  className?: string;
}

export function ScamAlert({ likelyScam, scamRisk, scamSignals, compact, className }: ScamAlertProps) {
  if (!likelyScam && scamRisk !== "high" && scamRisk !== "medium") return null;

  const isHigh = likelyScam || scamRisk === "high";

  return (
    <div
      className={cn("rounded-[10px] p-3.5", className)}
      style={{
        border: isHigh
          ? "0.5px solid var(--cc-scam-border)"
          : "0.5px solid rgba(255,149,0,0.25)",
        background: isHigh
          ? "var(--cc-scam-bg)"
          : "rgba(255,149,0,0.07)",
      }}
      role="alert"
      aria-label={isHigh ? "High scam risk" : "Medium scam risk"}
    >
      <div className="flex items-center gap-2">
        <ShieldAlert
          className="h-4 w-4 shrink-0"
          style={{ color: isHigh ? "var(--cc-red)" : "var(--cc-orange)" }}
          aria-hidden
        />
        <span
          className="text-[13px] font-semibold"
          style={{ color: isHigh ? "var(--cc-red)" : "var(--cc-orange)" }}
        >
          {isHigh ? "High scam risk" : "Potential scam"}
        </span>
      </div>

      {!compact && scamSignals && scamSignals.length > 0 && (
        <ul className="mt-2 space-y-1 pl-6" aria-label="Scam signals">
          {scamSignals.map((signal) => (
            <li key={signal} className="list-disc text-[12px]" style={{ color: "var(--cc-body)" }}>
              {signal}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
