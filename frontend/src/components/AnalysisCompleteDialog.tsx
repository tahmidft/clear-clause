import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CheckCircle2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AnalysisCompleteDialogProps {
  open: boolean;
  contractId: string;
  fileName?: string;
  onClose: () => void;
}

export function AnalysisCompleteDialog({ open, contractId, fileName, onClose }: AnalysisCompleteDialogProps) {
  const navigate = useNavigate();

  const handleView = () => {
    onClose();
    navigate(`/analysis/${contractId}`);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50"
          style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
        />

        {/* Dialog */}
        <DialogPrimitive.Content
          className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,360px)] -translate-x-1/2 -translate-y-1/2 rounded-[18px] p-0 outline-none"
          style={{
            background: "var(--cc-modal-bg)",
            border: "0.5px solid var(--cc-modal-border)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
          }}
          aria-describedby="analysis-complete-desc"
        >
          {/* Close button */}
          <DialogPrimitive.Close asChild>
            <button
              type="button"
              className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-accent)]"
              style={{ background: "var(--cc-modal-secondary-bg)", border: "none", color: "var(--cc-muted)", cursor: "pointer" }}
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </DialogPrimitive.Close>

          {/* Body */}
          <div className="flex flex-col items-center px-6 pb-5 pt-8 text-center">
            {/* Success icon */}
            <div
              className="mb-4 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "var(--cc-accept-bg)", border: "1px solid var(--cc-accept-border)" }}
            >
              <CheckCircle2 className="h-7 w-7" style={{ color: "var(--cc-green)" }} aria-hidden />
            </div>

            <DialogPrimitive.Title
              className="text-[18px] font-semibold leading-tight"
              style={{ color: "var(--cc-modal-title)", letterSpacing: "-0.02em" }}
            >
              Analysis complete
            </DialogPrimitive.Title>

            {fileName ? (
              <p
                id="analysis-complete-desc"
                className="mt-2 max-w-xs text-[13px] leading-relaxed"
                style={{ color: "var(--cc-modal-body)" }}
              >
                {fileName} has been analysed. View the full breakdown for insights.
              </p>
            ) : (
              <p id="analysis-complete-desc" className="sr-only">Your contract has been analysed.</p>
            )}
          </div>

          {/* Divider */}
          <div style={{ height: "0.5px", background: "var(--cc-modal-divider)", margin: "0 24px" }} />

          {/* Actions */}
          <div className="flex gap-2.5 p-5">
            <button
              type="button"
              className="flex-1 rounded-[10px] py-2.5 text-[14px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-accent)]"
              style={{
                background: "var(--cc-modal-secondary-bg)",
                border: "0.5px solid var(--cc-modal-secondary-border)",
                color: "var(--cc-modal-secondary-color)",
                cursor: "pointer",
                transition: "filter 0.2s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.filter = "brightness(1.05)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.filter = ""; }}
              onClick={onClose}
            >
              Dismiss
            </button>
            <button
              type="button"
              className="flex-1 rounded-[10px] py-2.5 text-[14px] font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-accent)]"
              style={{
                background: "var(--cc-accent)",
                border: "none",
                cursor: "pointer",
                transition: "filter 0.2s ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.filter = "brightness(1.1)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.filter = ""; }}
              onClick={handleView}
            >
              View analysis
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
