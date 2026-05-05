import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { usePreferences } from "@/context/PreferencesContext";
import { savePreferences } from "@/lib/api";
import type { Preference } from "@/types";

const STEPS = 3;

export default function Onboarding() {
  const navigate = useNavigate();
  const { preferences, loading, refresh } = usePreferences();
  const [step, setStep] = React.useState(0);
  const [saving, setSaving] = React.useState(false);

  const [paymentTermsDays, setPaymentTermsDays] = React.useState(30);
  const [ipOwnership, setIpOwnership] = React.useState(true);
  const [unpaidRevisions, setUnpaidRevisions] = React.useState(false);
  const [nonCompete, setNonCompete] = React.useState(false);
  const [terminationNoticeDays, setTerminationNoticeDays] = React.useState(14);

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
          className={`h-2.5 w-2.5 rounded-full ${i === step ? "bg-[var(--color-blue)]" : "bg-[var(--color-separator)]"}`}
          aria-current={i === step ? "step" : undefined}
        />
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-center font-display text-[34px] font-semibold">Set your preferences</h1>
      <p className="mt-2 text-center text-[17px] text-[var(--color-secondary)]">We use these to flag conflicts in every contract.</p>
      <div className="mt-8">{dots}</div>

      {step === 0 ? (
        <Card className="mt-8 space-y-8 rounded-[12px] border border-[var(--color-separator)] bg-[var(--color-surface)] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
          <div>
            <h2 className="font-display text-xl font-semibold">What are your payment requirements?</h2>
            <p className="mt-2 text-[17px] text-[var(--color-secondary)]">Maximum net terms you will accept.</p>
            <Label className="mt-6 block text-[17px]">Net {paymentTermsDays} days</Label>
            <Slider
              className="mt-3"
              min={7}
              max={60}
              step={1}
              value={[paymentTermsDays]}
              onValueChange={(v) => setPaymentTermsDays(v[0] ?? 30)}
              aria-label="Payment terms in days"
            />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-[10px] border border-[var(--color-separator)] p-4">
            <div>
              <p className="font-medium text-[var(--color-label)]">I require IP ownership</p>
              <p className="text-sm text-[var(--color-secondary)]">Flag contracts that keep rights with the client.</p>
            </div>
            <Switch checked={ipOwnership} onCheckedChange={setIpOwnership} aria-label="Require IP ownership" />
          </div>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card className="mt-8 space-y-6 rounded-[12px] border border-[var(--color-separator)] bg-[var(--color-surface)] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
          <h2 className="font-display text-xl font-semibold">What are your revision policies?</h2>
          <div className="flex items-center justify-between gap-4 rounded-[10px] border border-[var(--color-separator)] p-4">
            <div>
              <p className="font-medium">I accept unpaid revisions</p>
              <p className="text-sm text-[var(--color-secondary)]">Turn off if you expect paid rounds.</p>
            </div>
            <Switch checked={unpaidRevisions} onCheckedChange={setUnpaidRevisions} aria-label="Accept unpaid revisions" />
          </div>
          <div className="flex items-center justify-between gap-4 rounded-[10px] border border-[var(--color-separator)] p-4">
            <div>
              <p className="font-medium">I accept non-compete clauses</p>
              <p className="text-sm text-[var(--color-secondary)]">We will flag restrictive covenants if this is off.</p>
            </div>
            <Switch checked={nonCompete} onCheckedChange={setNonCompete} aria-label="Accept non-compete clauses" />
          </div>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card className="mt-8 space-y-6 rounded-[12px] border border-[var(--color-separator)] bg-[var(--color-surface)] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
          <h2 className="font-display text-xl font-semibold">Termination notice</h2>
          <p className="text-[17px] text-[var(--color-secondary)]">Minimum notice you need before a project ends.</p>
          <Label className="mt-4 block text-[17px]">{terminationNoticeDays} days notice</Label>
          <Slider
            className="mt-3"
            min={7}
            max={60}
            step={1}
            value={[terminationNoticeDays]}
            onValueChange={(v) => setTerminationNoticeDays(v[0] ?? 14)}
            aria-label="Termination notice in days"
          />
        </Card>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 rounded-[10px]"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          aria-label="Previous step"
        >
          Back
        </Button>
        {step < STEPS - 1 ? (
          <Button type="button" className="min-h-11 rounded-[10px]" onClick={() => setStep((s) => s + 1)} aria-label="Next step">
            Next
          </Button>
        ) : (
          <Button type="button" className="min-h-11 rounded-[10px]" disabled={saving} onClick={submit} aria-busy={saving}>
            {saving ? "Saving..." : "Finish"}
          </Button>
        )}
      </div>
    </div>
  );
}
