import * as React from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RiskBadge } from "@/components/RiskBadge";
import { cn } from "@/lib/utils";
import type { Section } from "@/types";

interface SectionCardProps {
  section: Section;
}

export function SectionCard({ section }: SectionCardProps) {
  const [open, setOpen] = React.useState(false);
  const panelId = React.useId();
  const buttonId = React.useId();

  return (
    <Card className="overflow-hidden rounded-[12px] border border-[var(--color-separator)] bg-[var(--color-surface)] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="font-display text-xl font-semibold tracking-tight text-[var(--color-label)]">{section.title}</h3>
        <RiskBadge level={section.risk_level} />
      </div>
      <p className="mt-4 text-[17px] leading-relaxed text-[var(--color-secondary)]">{section.plain_english}</p>
      {section.conflicts_with_preference ? (
        <div
          className="mt-4 flex items-start gap-2 rounded-[10px] border border-[var(--color-yellow)]/40 bg-[var(--color-yellow)]/12 px-4 py-3 text-[17px] text-[var(--color-label)]"
          role="note"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-yellow)]" aria-hidden />
          <span>
            <span className="font-medium">Conflicts with your preferences.</span> Review this section carefully before
            you agree.
          </span>
        </div>
      ) : null}
      <p className="mt-3 text-sm text-[var(--color-secondary)]">{section.risk_reason}</p>
      <div className="mt-4 border-t border-[var(--color-separator)] pt-4">
        <Button
          id={buttonId}
          type="button"
          variant="ghost"
          className="min-h-11 w-full justify-between rounded-[10px] px-3 text-[17px] text-[var(--color-blue)] hover:bg-[var(--color-blue)]/10"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? "Hide original contract text" : "View original contract text"}
        >
          <span>View original text</span>
          <ChevronDown className={cn("h-5 w-5 transition-transform", open && "rotate-180")} aria-hidden />
        </Button>
        <div
          id={panelId}
          role="region"
          aria-labelledby={buttonId}
          className={cn(
            "grid transition-[grid-template-rows] duration-200 ease-out",
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden">
            <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-[8px] border border-[var(--color-separator)] bg-[var(--color-bg)] p-4 text-sm text-[var(--color-secondary)]">
              {section.original_text}
            </pre>
          </div>
        </div>
      </div>
    </Card>
  );
}
