import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/context/AuthContext";
import { usePreferences } from "@/context/PreferencesContext";
import { savePreferences } from "@/lib/api";
import type { Preference } from "@/types";

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { preferences, loading, refresh } = usePreferences();

  const [paymentTermsDays, setPaymentTermsDays] = React.useState(30);
  const [ipOwnership, setIpOwnership] = React.useState(true);
  const [unpaidRevisions, setUnpaidRevisions] = React.useState(false);
  const [nonCompete, setNonCompete] = React.useState(false);
  const [terminationNoticeDays, setTerminationNoticeDays] = React.useState(14);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (preferences) {
      setPaymentTermsDays(preferences.payment_terms_days);
      setIpOwnership(preferences.ip_ownership);
      setUnpaidRevisions(preferences.unpaid_revisions);
      setNonCompete(preferences.non_compete);
      setTerminationNoticeDays(preferences.termination_notice_days);
    }
  }, [preferences]);

  const onSave = async () => {
    const body: Preference = {
      unpaid_revisions: unpaidRevisions,
      payment_terms_days: paymentTermsDays,
      ip_ownership: ipOwnership,
      non_compete: nonCompete,
      termination_notice_days: terminationNoticeDays,
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

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div>
        <h1 className="font-display text-[34px] font-semibold">Settings</h1>
        <p className="mt-1 text-[17px] text-[var(--color-secondary)]">Tune how ClearClause compares contracts to your standards.</p>
      </div>

      <Card className="space-y-8 rounded-[12px] border border-[var(--color-separator)] bg-[var(--color-surface)] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
        <h2 className="font-display text-xl font-semibold">Contract preferences</h2>
        {loading && !preferences ? (
          <p className="text-[var(--color-secondary)]">Loading your preferences...</p>
        ) : (
          <>
            <div>
              <Label className="text-[17px]">Net {paymentTermsDays} days</Label>
              <Slider
                className="mt-3"
                min={7}
                max={60}
                step={1}
                value={[paymentTermsDays]}
                onValueChange={(v) => setPaymentTermsDays(v[0] ?? 30)}
                aria-label="Maximum payment terms in days"
              />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-[10px] border border-[var(--color-separator)] p-4">
              <div>
                <p className="font-medium">Require IP ownership</p>
                <p className="text-sm text-[var(--color-secondary)]">Highlight agreements that retain client IP.</p>
              </div>
              <Switch checked={ipOwnership} onCheckedChange={setIpOwnership} aria-label="Require IP ownership" />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-[10px] border border-[var(--color-separator)] p-4">
              <div>
                <p className="font-medium">Accept unpaid revisions</p>
                <p className="text-sm text-[var(--color-secondary)]">Turn off to flag unlimited unpaid rounds.</p>
              </div>
              <Switch checked={unpaidRevisions} onCheckedChange={setUnpaidRevisions} aria-label="Accept unpaid revisions" />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-[10px] border border-[var(--color-separator)] p-4">
              <div>
                <p className="font-medium">Accept non-compete</p>
                <p className="text-sm text-[var(--color-secondary)]">We will warn on restrictive covenants if disabled.</p>
              </div>
              <Switch checked={nonCompete} onCheckedChange={setNonCompete} aria-label="Accept non-compete clauses" />
            </div>
            <div>
              <Label className="text-[17px]">Termination notice {terminationNoticeDays} days</Label>
              <Slider
                className="mt-3"
                min={7}
                max={60}
                step={1}
                value={[terminationNoticeDays]}
                onValueChange={(v) => setTerminationNoticeDays(v[0] ?? 14)}
                aria-label="Minimum termination notice in days"
              />
            </div>
            <Button type="button" className="min-h-11 rounded-[10px]" disabled={saving} onClick={onSave} aria-busy={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </>
        )}
      </Card>

      <Card className="rounded-[12px] border border-[var(--color-separator)] bg-[var(--color-surface)] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)]">
        <h2 className="font-display text-xl font-semibold">Account</h2>
        <p className="mt-4 text-[17px] text-[var(--color-secondary)]">
          Signed in as <span className="font-medium text-[var(--color-label)]">{user?.email}</span>
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-6 min-h-11 rounded-[10px] text-[var(--color-red)] hover:bg-[var(--color-red)]/10 hover:text-[var(--color-red)]"
          onClick={async () => {
            await signOut();
            navigate("/login", { replace: true });
          }}
          aria-label="Sign out of ClearClause"
        >
          Sign out
        </Button>
      </Card>
    </div>
  );
}
