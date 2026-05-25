import * as React from "react";
import { FileSearch } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisProgressProps {
  running: boolean;
  finishing?: boolean;
  variant?: "compact" | "full";
  title?: string;
  progress?: number;
  className?: string;
}

export function AnalysisProgress({
  running,
  finishing = false,
  variant = "full",
  title,
  progress,
  className,
}: AnalysisProgressProps) {
  const [dots, setDots] = React.useState("");
  const [localPct, setLocalPct] = React.useState(0);

  /* Animated dot ellipsis */
  React.useEffect(() => {
    if (!running && !finishing) return;
    const id = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 500);
    return () => clearInterval(id);
  }, [running, finishing]);

  /* Simulated progress bar */
  React.useEffect(() => {
    if (!running) {
      if (finishing) setLocalPct(100);
      return;
    }
    setLocalPct((p) => (p < 10 ? 10 : p));
    const id = setInterval(() => {
      setLocalPct((p) => {
        if (p >= 90) return p;
        const bump = p < 30 ? 4 : p < 60 ? 2 : 1;
        return p + bump * (0.5 + Math.random());
      });
    }, 400);
    return () => clearInterval(id);
  }, [running, finishing]);

  const pct = progress != null ? progress : localPct;
  const label = finishing ? "Complete" : `Analyzing${dots}`;
  const label2 = title ? `Analyzing: ${title}` : `Analyzing contract${dots}`;

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-3", className)} role="status" aria-live="polite" aria-label={label2}>
        <FileSearch
          className="h-5 w-5 shrink-0"
          style={{ color: "var(--cc-accent)" }}
          aria-hidden
        />
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-medium" style={{ color: "var(--cc-body)" }}>{label}</span>
            <span className="tabular-nums text-[12px]" style={{ color: "var(--cc-muted)" }}>{Math.round(pct)}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full" style={{ background: "var(--cc-progress-track)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                background: "var(--cc-progress-fill)",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("w-full rounded-[14px] p-5", className)}
      style={{
        background: "var(--cc-card-bg)",
        border: "0.5px solid var(--cc-card-border)",
      }}
      role="status"
      aria-live="polite"
      aria-label={label2}
    >
      <div className="flex items-center gap-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px]"
          style={{ background: "var(--cc-zone-bg)", border: "0.5px solid var(--cc-card-border)" }}
        >
          <FileSearch className="h-5 w-5" style={{ color: "var(--cc-accent)" }} aria-hidden />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold" style={{ color: "var(--cc-title)" }}>
              {finishing ? "Analysis complete" : `Analyzing${dots}`}
            </span>
            <span className="tabular-nums text-[13px]" style={{ color: "var(--cc-muted)" }}>{Math.round(pct)}%</span>
          </div>
          {title && (
            <p className="line-clamp-1 text-[12px]" style={{ color: "var(--cc-subtle)" }}>{title}</p>
          )}
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--cc-progress-track)" }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: "var(--cc-progress-fill)",
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}
