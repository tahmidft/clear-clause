import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { usePreferences } from "@/context/PreferencesContext";
import { savePreferences } from "@/lib/api";
import type { Preference } from "@/types";

const STEPS = 6;

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

export default function Onboarding() {
  const navigate = useNavigate();
  const { preferences, loading, refresh } = usePreferences();
  const [step, setStep] = React.useState(0);
  const [saving, setSaving] = React.useState(false);

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

  React.useEffect(() => {
    if (!loading && preferences) {
      void navigate("/dashboard", { replace: true });
    }
  }, [loading, preferences, navigate]);

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

  const submit = async () => {
    setSaving(true);
    try {
      await savePreferences(body);
      await refresh();
      navigate("/dashboard", { replace: true });
    } catch {
      /* toast from api */
    } finally {
      setSaving(false);
    }
  };

  const dots = (
    <div className="flex justify-center gap-2" role="navigation" aria-label="Onboarding progress">
      {Array.from({ length: STEPS }).map((_, i) => (
        <span
          key={i}
          className="h-2.5 w-2.5 rounded-full transition-opacity duration-200"
          style={{ background: i === step ? "var(--cc-accent)" : "var(--cc-search-border)" }}
          aria-current={i === step ? "step" : undefined}
        />
      ))}
    </div>
  );

  const cardStyle: React.CSSProperties = {
    background: "var(--cc-card-bg)",
    border: "0.5px solid var(--cc-card-border)",
    borderRadius: 14,
    padding: "20px",
  };

  const sectionTitle = (text: string) => (
    <h2 className="font-semibold tracking-tight" style={{ fontSize: 16, color: "var(--cc-title)" }}>{text}</h2>
  );

  const sliderLabel = (text: string) => (
    <span className="block text-[13px] font-medium" style={{ color: "var(--cc-body)" }}>{text}</span>
  );

  return (
    <div className="safe-bottom mx-auto max-w-lg px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:py-12">
      <h1
        className="text-center"
        style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", color: "var(--cc-title)" }}
      >
        Set your preferences
      </h1>
      <p className="mt-2 text-center text-[13px]" style={{ color: "var(--cc-muted)" }}>
        We compare every contract to these standards and flag scams separately.
      </p>
      <div className="mt-6">{dots}</div>

      {step === 0 ? (
        <div className="mt-7 space-y-4" style={cardStyle}>
          {sectionTitle("Welcome to ClearClause")}
          <p className="text-[14px] leading-relaxed" style={{ color: "var(--cc-muted)" }}>
            We&apos;ll walk through payment, scope, revisions, termination, and liability — the clauses freelancers care about most. You can change everything later in Settings.
          </p>
          <p className="text-[13px]" style={{ color: "var(--cc-subtle)" }}>About two minutes.</p>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="mt-7 space-y-6" style={cardStyle}>
          <div>
            {sectionTitle("Payment & deposits")}
            <p className="mt-1.5 text-[13px]" style={{ color: "var(--cc-muted)" }}>How you expect to get paid on freelance work.</p>
            <Label className="mt-5 block">{sliderLabel(`Maximum net terms: ${paymentTermsDays} days`)}</Label>
            <Slider className="mt-3" min={7} max={60} step={1} value={[paymentTermsDays]} onValueChange={(v) => setPaymentTermsDays(v[0] ?? 30)} aria-label="Maximum payment terms in days" />
          </div>
          <PrefRow title="Require upfront deposit" description="Flag contracts with no deposit or payment only after delivery." checked={requiresDeposit} onCheckedChange={setRequiresDeposit} ariaLabel="Require upfront deposit" />
          {requiresDeposit ? (
            <div>
              <Label>{sliderLabel(`Minimum deposit: ${minDepositPercent}%`)}</Label>
              <Slider className="mt-3" min={0} max={100} step={5} value={[minDepositPercent]} onValueChange={(v) => setMinDepositPercent(v[0] ?? 25)} aria-label="Minimum deposit percent" />
            </div>
          ) : null}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-7 space-y-4" style={cardStyle}>
          {sectionTitle("Work product & scope")}
          <PrefRow title="I require IP ownership" description="Flag agreements that assign all rights to the client without a license back." checked={ipOwnership} onCheckedChange={setIpOwnership} ariaLabel="Require IP ownership" />
          <PrefRow title="Require written scope of work" description="Flag vague or missing SOWs and scope that can change without a change order." checked={writtenScopeRequired} onCheckedChange={setWrittenScopeRequired} ariaLabel="Require written scope of work" />
        </div>
      ) : null}

      {step === 3 ? (
        <div className="mt-7 space-y-4" style={cardStyle}>
          {sectionTitle("Revisions & restrictions")}
          <PrefRow title="I accept unpaid revisions" description="Turn off to flag unlimited or unpaid revision rounds." checked={unpaidRevisions} onCheckedChange={setUnpaidRevisions} ariaLabel="Accept unpaid revisions" />
          <div>
            <Label>{sliderLabel(`Maximum revision rounds: ${maxRevisionRounds}`)}</Label>
            <p className="mt-1 text-[12px]" style={{ color: "var(--cc-subtle)" }}>We flag unlimited revisions or rounds above this number.</p>
            <Slider className="mt-3" min={0} max={20} step={1} value={[maxRevisionRounds]} onValueChange={(v) => setMaxRevisionRounds(v[0] ?? 3)} aria-label="Maximum revision rounds" />
          </div>
          <PrefRow title="I accept non-compete clauses" description="We flag restrictive covenants when this is off." checked={nonCompete} onCheckedChange={setNonCompete} ariaLabel="Accept non-compete clauses" />
        </div>
      ) : null}

      {step === 4 ? (
        <div className="mt-7 space-y-4" style={cardStyle}>
          {sectionTitle("Termination")}
          <p className="text-[13px]" style={{ color: "var(--cc-muted)" }}>Minimum notice you need before a client can end the project.</p>
          <Label>{sliderLabel(`${terminationNoticeDays} days notice`)}</Label>
          <Slider className="mt-3" min={7} max={60} step={1} value={[terminationNoticeDays]} onValueChange={(v) => setTerminationNoticeDays(v[0] ?? 14)} aria-label="Termination notice in days" />
        </div>
      ) : null}

      {step === 5 ? (
        <div className="mt-7 space-y-4" style={cardStyle}>
          {sectionTitle("Liability & risk")}
          <PrefRow title="Require liability cap" description="Flag unlimited contractor liability or one-sided caps." checked={liabilityCapRequired} onCheckedChange={setLiabilityCapRequired} ariaLabel="Require liability cap" />
          <PrefRow title="I accept broad indemnification" description="Turn off to flag clauses where you indemnify the client for most claims." checked={acceptsBroadIndemnification} onCheckedChange={setAcceptsBroadIndemnification} ariaLabel="Accept broad indemnification" />
          <PrefRow title="Require kill fee on early termination" description="Flag client convenience termination with no minimum payment." checked={killFeeRequired} onCheckedChange={setKillFeeRequired} ariaLabel="Require kill fee" />
        </div>
      ) : null}

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" className="min-h-11 rounded-[10px]" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))} aria-label="Previous step">
          Back
        </Button>
        {step < STEPS - 1 ? (
          <Button type="button" className="min-h-11 rounded-[10px]" onClick={() => setStep((s) => s + 1)} aria-label="Next step">
            {step === 0 ? "Get started" : "Next"}
          </Button>
        ) : (
          <Button type="button" className="min-h-11 rounded-[10px]" disabled={saving} onClick={submit} aria-busy={saving}>
            {saving ? "Saving…" : "Finish"}
          </Button>
        )}
      </div>
    </div>
  );
}
