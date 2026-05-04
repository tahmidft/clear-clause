import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function fmtSize(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();

  const accept = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  const onSelect = (f?: File | null) => {
    if (!f) return;
    const ok = /\.(pdf|docx)$/i.test(f.name);
    if (!ok) return;
    setFile(f);
  };

  const analyze = () => {
    setBusy(true);
    setTimeout(() => nav("/analysis/c1"), 900);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Upload a contract</h1>
      <p className="mt-2 text-lg text-muted-foreground">PDF or DOCX, up to 20 MB. Files stay private.</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          onSelect(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "mt-8 rounded-3xl border-2 border-dashed bg-surface p-10 text-center shadow-card transition-colors md:p-16",
          drag ? "border-primary bg-accent" : "border-border",
        )}
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <UploadCloud className="h-7 w-7" aria-hidden />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">Drag and drop your file</h2>
        <p className="mt-1 text-muted-foreground">or click to browse</p>
        <Button
          onClick={() => inputRef.current?.click()}
          variant="outline"
          className="mt-5 h-11 rounded-full px-5"
        >
          Choose file
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => onSelect(e.target.files?.[0])}
          aria-label="Upload contract file"
        />
      </div>

      {file && (
        <div className="mt-6 flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 shadow-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <FileText className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[17px] font-medium">{file.name}</div>
            <div className="text-sm text-muted-foreground">
              {file.name.split(".").pop()?.toUpperCase()} · {fmtSize(file.size)}
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full" onClick={() => setFile(null)} aria-label="Remove file">
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <Button disabled={!file || busy} onClick={analyze} className="h-12 rounded-full px-6 text-base">
          {busy ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing…</>) : "Analyze contract"}
        </Button>
      </div>
    </div>
  );
}