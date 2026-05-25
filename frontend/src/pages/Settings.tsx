import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/context/AuthContext";
import { usePreferences } from "@/context/PreferencesContext";
import { savePreferences } from "@/lib/api";
import type { Preference } from "@/types";

function PrefRow({
  title,
  description,
  checked,
  onCheckedChange,
  ariaLabel,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <div
      className="flex flex-col gap-3 rounded-[10px] p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
      style={{ border: "0.5px solid var(--cc-pref-row-border)", background: "var(--cc-pref-row-bg)" }}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium" style={{ color: "var(--cc-body)" }}>{title}</p>
        <p className="text-[13px]" style={{ color: "var(--cc-muted)" }}>{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={ariaLabel}
        className="h-7 w-11 shrink-0 self-start sm:self-center"
      />
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { preferences, loading, refresh } = usePreferences();

  const [paymentTermsDays, setPaymentTermsDays] = React.useState(30);
  const [requiresDeposit, setRequiresDeposit] = React.useState(true);
  const [minDepositPercent, setMinDepositPercent] = React.useState(25);
  const [ipOwnership, setIpOwnership] = React.useState(true);
  const [writtenScopeRequired, setWrittenScopeRequired] = React.useState(true);
  const [unpaidRevisions, setUnpaidRevisions] = React.useState(false);
  const [maxRevisionRounds, setMaxRevisionRounds] = React.useState(3);
  const [nonCompete, setNonCompete] = React.useState(false);
  const [terminationNoticeDays, setTerminationNoticeDays] = React.useState(14);
  const [liabilityCapRequired, setLiabilityCapRequired] = React.useState(true);
  const [acceptsBroadIndemnification, setAcceptsBroadIndemnification] = React.useState(false);
  const [killFeeRequired, setKillFeeRequired] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (preferences) {
      setPaymentTermsDays(preferences.payment_terms_days);
      setRequiresDeposit(preferences.requires_deposit);
      setMinDepositPercent(preferences.min_deposit_percent);
      setIpOwnership(preferences.ip_ownership);
      setWrittenScopeRequired(preferences.written_scope_required);
      setUnpaidRevisions(preferences.unpaid_revisions);
      setMaxRevisionRounds(preferences.max_revision_rounds);
      setNonCompete(preferences.non_compete);
      setTerminationNoticeDays(preferences.termination_notice_days);
      setLiabilityCapRequired(preferences.liability_cap_required);
      setAcceptsBroadIndemnification(preferences.accepts_broad_indemnification);
      setKillFeeRequired(preferences.kill_fee_required);
    }
  }, [preferences]);

  const onSave = async () => {
    const body: Preference = {
      unpaid_revisions: unpaidRevisions,
      payment_terms_days: paymentTermsDays,
      ip_ownership: ipOwnership,
      non_compete: nonCompete,
      termination_notice_days: terminationNoticeDays,
      max_revision_rounds: maxRevisionRounds,
      requires_deposit: requiresDeposit,
      min_deposit_percent: minDepositPercent,
      liability_cap_required: liabilityCapRequired,
      accepts_broad_indemnification: acceptsBroadIndemnification,
      kill_fee_required: killFeeRequired,
      written_scope_required: writtenScopeRequired,
    };
    setSaving(true);
    try {
      await savePreferences(body);
      await refresh();
    } catch {
      /* api toast */
    } finally {
      setSaving(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    background: "var(--cc-card-bg)",
    border: "0.5px solid var(--cc-card-border)",
    borderRadius: 14,
    padding: "20px",
  };

  const sectionH2 = (text: string) => (
    <h2 className="font-semibold tracking-tight" style={{ fontSize: 15, color: "var(--cc-title)" }}>{text}</h2>
  );

  const sliderLabel = (text: string) => (
    <span className="text-[13px] font-medium" style={{ color: "var(--cc-body)" }}>{text}</span>
  );

  return (
    <div className="mx-auto min-w-0 max-w-2xl space-y-6">
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--cc-title)" }}>Settings</h1>
        <p className="mt-1 text-[13px]" style={{ color: "var(--cc-muted)" }}>
          Tune how ClearClause compares contracts to your standards.
        </p>
      </div>

      <div className="space-y-6" style={cardStyle}>
        {sectionH2("Payment & deposits")}
        {loading && !preferences ? (
          <p className="text-[13px]" style={{ color: "var(--cc-muted)" }}>Loading your preferences…</p>
        ) : (
          <>
            <div>
              <Label>{sliderLabel(`Net ${paymentTermsDays} days (maximum)`)}</Label>
              <Slider className="mt-3" min={7} max={60} step={1} value={[paymentTermsDays]} onValueChange={(v) => setPaymentTermsDays(v[0] ?? 30)} aria-label="Maximum payment terms in days" />
            </div>
            <PrefRow title="Require upfront deposit" description="Highlight agreements with no deposit." checked={requiresDeposit} onCheckedChange={setRequiresDeposit} ariaLabel="Require upfront deposit" />
            {requiresDeposit ? (
              <div>
                <Label>{sliderLabel(`Minimum deposit ${minDepositPercent}%`)}</Label>
                <Slider className="mt-3" min={0} max={100} step={5} value={[minDepositPercent]} onValueChange={(v) => setMinDepositPercent(v[0] ?? 25)} aria-label="Minimum deposit percent" />
              </div>
            ) : null}
          </>
        )}
      </div>

      {preferences ? (
        <>
          <div className="space-y-4" style={cardStyle}>
            {sectionH2("Work product & scope")}
            <PrefRow title="Require IP ownership" description="Highlight agreements that retain all IP with the client." checked={ipOwnership} onCheckedChange={setIpOwnership} ariaLabel="Require IP ownership" />
            <PrefRow title="Require written scope of work" description="Flag vague scope or missing SOW." checked={writtenScopeRequired} onCheckedChange={setWrittenScopeRequired} ariaLabel="Require written scope of work" />
          </div>

          <div className="space-y-4" style={cardStyle}>
            {sectionH2("Revisions & restrictions")}
            <PrefRow title="Accept unpaid revisions" description="Turn off to flag unlimited unpaid rounds." checked={unpaidRevisions} onCheckedChange={setUnpaidRevisions} ariaLabel="Accept unpaid revisions" />
            <div>
              <Label>{sliderLabel(`Maximum revision rounds: ${maxRevisionRounds}`)}</Label>
              <Slider className="mt-3" min={0} max={20} step={1} value={[maxRevisionRounds]} onValueChange={(v) => setMaxRevisionRounds(v[0] ?? 3)} aria-label="Maximum revision rounds" />
            </div>
            <PrefRow title="Accept non-compete" description="We warn on restrictive covenants if disabled." checked={nonCompete} onCheckedChange={setNonCompete} ariaLabel="Accept non-compete clauses" />
          </div>

          <div className="space-y-4" style={cardStyle}>
            {sectionH2("Termination")}
            <Label>{sliderLabel(`Minimum notice ${terminationNoticeDays} days`)}</Label>
            <Slider className="mt-3" min={7} max={60} step={1} value={[terminationNoticeDays]} onValueChange={(v) => setTerminationNoticeDays(v[0] ?? 14)} aria-label="Minimum termination notice in days" />
          </div>

          <div className="space-y-4" style={cardStyle}>
            {sectionH2("Liability & risk")}
            <PrefRow title="Require liability cap" description="Flag unlimited contractor liability." checked={liabilityCapRequired} onCheckedChange={setLiabilityCapRequired} ariaLabel="Require liability cap" />
            <PrefRow title="Accept broad indemnification" description="Turn off to flag one-sided indemnity." checked={acceptsBroadIndemnification} onCheckedChange={setAcceptsBroadIndemnification} ariaLabel="Accept broad indemnification" />
            <PrefRow title="Require kill fee" description="Flag early termination with no minimum payment." checked={killFeeRequired} onCheckedChange={setKillFeeRequired} ariaLabel="Require kill fee" />
            <Button type="button" className="min-h-11 rounded-[10px]" disabled={saving} onClick={onSave} aria-busy={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </>
      ) : null}

      <div style={cardStyle}>
        {sectionH2("Account")}
        <p className="mt-3 text-[13px]" style={{ color: "var(--cc-muted)" }}>
          Signed in as{" "}
          <span className="font-medium" style={{ color: "var(--cc-email-color)" }}>{user?.email}</span>
        </p>
        <button
          type="button"
          className="mt-4 flex items-center gap-2 rounded-[10px] px-4 py-2.5 text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-[var(--cc-sign-out-color)]"
          style={{
            color: "var(--cc-sign-out-color)",
            background: "transparent",
            border: "0.5px solid var(--cc-reject-border)",
            cursor: "pointer",
            transition: "background 0.2s ease",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--cc-reject-bg)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          onClick={async () => { await signOut(); navigate("/login", { replace: true }); }}
          aria-label="Sign out of ClearClause"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
