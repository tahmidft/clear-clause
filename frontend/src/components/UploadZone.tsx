import * as React from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPT = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

export function UploadZone({ onFileSelected, disabled, className }: UploadZoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);

  const validateAndEmit = (file: File | undefined) => {
    if (!file) return;
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".pdf") && !lower.endsWith(".docx")) {
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      return;
    }
    onFileSelected(file);
  };

  return (
    <div
      className={cn(
        "rounded-[12px] border-2 border-dashed border-[var(--color-separator)] bg-[var(--color-surface)] p-6 text-center shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-colors dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)]",
        dragOver && "border-[var(--color-blue)] bg-[var(--color-blue)]/5",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        validateAndEmit(e.dataTransfer.files[0]);
      }}
      role="region"
      aria-label="Contract file upload area"
    >
      <Upload className="mx-auto h-10 w-10 text-[var(--color-blue)]" aria-hidden />
      <p className="mt-3 text-[17px] text-[var(--color-secondary)]">Drag and drop a PDF or DOCX here, or</p>
      <Button
        type="button"
        className="mt-4 min-h-11 rounded-[10px] px-6"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        aria-label="Choose contract file to upload"
      >
        Choose file
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        disabled={disabled}
        aria-hidden
        onChange={(e) => {
          validateAndEmit(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <p className="mt-2 text-sm text-[var(--color-secondary)]">PDF or DOCX, up to 10 MB</p>
    </div>
  );
}
