import * as React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isLikelyScamAnalysis } from "@/lib/contractBuckets";
import type { Analysis } from "@/types";

export type BatchPickerItem = {
  contractId: string;
  fileName: string;
};

interface BatchReviewPickerDialogProps {
  open: boolean;
  items: BatchPickerItem[];
  analyses: Record<string, Analysis | null>;
  errorIds: Set<string>;
  onOpenChange: (open: boolean) => void;
  onStartReview: (selectedIds: string[]) => void;
}

export function BatchReviewPickerDialog({
  open,
  items,
  analyses,
  errorIds,
  onOpenChange,
  onStartReview,
}: BatchReviewPickerDialogProps) {
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set());

  React.useEffect(() => {
    if (open) {
      setSelected(new Set(items.map((i) => i.contractId)));
    }
  }, [open, items]);

  const toggle = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(85dvh,85vh)] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto rounded-[12px] sm:w-full">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Batch upload complete</DialogTitle>
          <DialogDescription className="text-[17px] leading-relaxed text-[var(--color-secondary)]">
            Choose which contracts to review now. You will switch between them using tabs — we will not open only the
            last file.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2 py-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-11 rounded-[8px] px-3"
            onClick={() => setSelected(new Set(items.map((i) => i.contractId)))}
          >
            Select all
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-11 rounded-[8px] px-3"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </Button>
        </div>

        <ul className="max-h-64 space-y-2 overflow-y-auto rounded-[10px] border border-[var(--color-separator)] p-2">
          {items.map((item) => {
            const a = analyses[item.contractId];
            const failed = errorIds.has(item.contractId);
            const checked = selected.has(item.contractId);
            return (
              <li
                key={item.contractId}
                className="flex min-h-11 items-start gap-3 rounded-[8px] px-2 py-2 hover:bg-[var(--color-bg)]"
              >
                <Checkbox
                  id={`batch-${item.contractId}`}
                  checked={checked}
                  onCheckedChange={(v) => toggle(item.contractId, v === true)}
                  aria-label={`Include ${item.fileName} in batch review`}
                  className="mt-1 h-5 w-5 shrink-0"
                />
                <label
                  htmlFor={`batch-${item.contractId}`}
                  className="flex min-h-11 min-w-0 flex-1 cursor-pointer flex-col justify-center py-1"
                >
                  <span className="block truncate text-[15px] font-medium text-[var(--color-label)]">{item.fileName}</span>
                  <span className="text-[13px] text-[var(--color-secondary)]">
                    {failed
                      ? "Analysis failed"
                      : a
                        ? isLikelyScamAnalysis(a)
                          ? "Likely scam"
                          : `${a.recommendation === "accept" ? "Accept" : "Reject"} · Score ${a.overall_score}`
                        : "No analysis"}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            className="min-h-11 w-full rounded-[10px] text-[17px]"
            disabled={selected.size === 0}
            onClick={() => {
              onStartReview([...selected]);
              onOpenChange(false);
            }}
          >
            Review {selected.size} contract{selected.size === 1 ? "" : "s"} in tabs
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full rounded-[10px] text-[17px]"
            onClick={() => onOpenChange(false)}
          >
            Skip — go to dashboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
