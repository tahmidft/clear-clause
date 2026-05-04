import { Link } from "react-router-dom";
import { FileText, Upload, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SAMPLE_CONTRACTS } from "@/lib/mockData";
import { ScoreBadge } from "@/components/RiskBadge";

const statusMeta = {
  accepted: { label: "Accepted", icon: CheckCircle2, cls: "text-success" },
  rejected: { label: "Rejected", icon: XCircle, cls: "text-destructive" },
  pending: { label: "Pending review", icon: Clock, cls: "text-muted-foreground" },
} as const;

export default function Dashboard() {
  const contracts = SAMPLE_CONTRACTS;
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Your contracts</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Reviewed by ClearClause against your deal-breakers.
          </p>
        </div>
        <Button asChild className="h-11 rounded-full px-5">
          <Link to="/upload"><Upload className="mr-1.5 h-4 w-4" />Upload contract</Link>
        </Button>
      </div>

      {contracts.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {contracts.map((c) => {
            const s = statusMeta[c.status];
            const Icon = s.icon;
            return (
              <li key={c.id}>
                <Link
                  to={`/analysis/${c.id}`}
                  className="block rounded-3xl border border-border bg-surface p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                      <FileText className="h-5 w-5" aria-hidden />
                    </div>
                    <ScoreBadge score={c.score} />
                  </div>
                  <h3 className="mt-5 text-[17px] font-semibold leading-snug">{c.name}</h3>
                  <div className="mt-1 text-sm text-muted-foreground">{c.client}</div>
                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm">
                    <time className="text-muted-foreground">
                      {new Date(c.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </time>
                    <span className={`inline-flex items-center gap-1.5 ${s.cls}`}>
                      <Icon className="h-4 w-4" aria-hidden />
                      {s.label}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-surface p-14 text-center shadow-card">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <Upload className="h-6 w-6" aria-hidden />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">No contracts yet</h2>
      <p className="mx-auto mt-2 max-w-md text-muted-foreground">
        Upload your first PDF or DOCX to see a clause-by-clause analysis with risk scores.
      </p>
      <Button asChild className="mt-6 h-11 rounded-full px-5">
        <Link to="/upload">Upload contract</Link>
      </Button>
    </div>
  );
}