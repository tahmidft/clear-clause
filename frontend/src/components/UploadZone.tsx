import * as React from "react";
import { Upload } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const ACCEPT = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
  multiple?: boolean;
}

export function UploadZone({ onFilesSelected, disabled, className, multiple = true }: UploadZoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const isMobile = useIsMobile();

  const emitFiles = (list: FileList | null | undefined) => {
    if (!list?.length) return;
    const valid: File[] = [];
    for (const file of Array.from(list)) {
      const lower = file.name.toLowerCase();
      if (!lower.endsWith(".pdf") && !lower.endsWith(".docx")) continue;
      if (file.size > 10 * 1024 * 1024) continue;
      valid.push(file);
    }
    if (valid.length) onFilesSelected(valid);
  };

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  return (
    <div
      className={cn(
        "rounded-[14px] p-5 text-center sm:p-6",
        !disabled && isMobile && "cursor-pointer",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      style={{
        border: dragOver
          ? "1.5px dashed var(--cc-zone-hover-border)"
          : "1.5px dashed var(--cc-zone-border)",
        background: dragOver ? "var(--cc-zone-hover-bg)" : "var(--cc-zone-bg)",
        transition: "border-color 0.2s ease, background 0.2s ease",
      }}
      onDragOver={(e) => {
        if (isMobile) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        if (isMobile) return;
        e.preventDefault();
        setDragOver(false);
        emitFiles(e.dataTransfer.files);
      }}
      onClick={isMobile ? openPicker : undefined}
      onKeyDown={
        isMobile
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openPicker();
              }
            }
          : undefined
      }
      role="region"
      aria-label="Contract file upload area"
      tabIndex={isMobile && !disabled ? 0 : undefined}
    >
      <Upload
        className="mx-auto h-9 w-9"
        style={{ color: "var(--cc-accent)", opacity: dragOver ? 1 : 0.7 }}
        aria-hidden
      />
      <p className="mt-3 text-[14px]" style={{ color: "var(--cc-muted)" }}>
        {isMobile ? (
          <>Tap to upload PDF or DOCX files</>
        ) : (
          <>Drag and drop PDF or DOCX files here, or</>
        )}
      </p>
      <button
        type="button"
        className="mt-3 min-h-11 rounded-[10px] px-5 py-2.5 text-[14px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-accent)]"
        style={{
          background: "var(--cc-accent)",
          color: "#ffffff",
          border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "filter 0.2s ease",
          letterSpacing: "-0.01em",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.filter = "brightness(1.1)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.filter = "";
        }}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          openPicker();
        }}
        aria-label="Choose contract files to upload"
      >
        Choose files
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        className="sr-only"
        tabIndex={-1}
        disabled={disabled}
        aria-hidden
        onChange={(e) => {
          emitFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <p className="mt-2 text-[12px]" style={{ color: "var(--cc-subtle)" }}>
        PDF or DOCX, up to 10 MB each{multiple ? " — select multiple to compare" : ""}
      </p>
    </div>
  );
}
