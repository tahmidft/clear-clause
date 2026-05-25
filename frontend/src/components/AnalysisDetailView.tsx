import { SectionCard } from "@/components/SectionCard";
import { RecommendationPanel } from "@/components/RecommendationPanel";
import { PaymentHighlight } from "@/components/PaymentHighlight";
import { ScamAlert } from "@/components/ScamAlert";
import { findPaymentSection } from "@/lib/contractBuckets";
import type { Analysis, Contract } from "@/types";

interface AnalysisDetailViewProps {
  contract: Contract;
  analysis: Analysis | null;
  compactTitle?: boolean;
}

export function AnalysisDetailView({ contract, analysis, compactTitle = false }: AnalysisDetailViewProps) {
  if (!analysis) {
    return (
      <p className="py-8 text-[17px]" style={{ color: "var(--cc-muted)" }}>
        Analysis is not available for this contract yet.
      </p>
    );
  }

  const paymentSection = findPaymentSection(analysis);
  const detailSections = analysis.sections.filter((s) => !paymentSection || s.title !== paymentSection.title);

  return (
    <div className="min-w-0">
      {!compactTitle ? (
        <h2
          className="break-words font-semibold tracking-tight"
          style={{ fontSize: "clamp(22px, 4vw, 28px)", color: "var(--cc-title)", letterSpacing: "-0.03em" }}
        >
          {contract.file_name}
        </h2>
      ) : null}
      {paymentSection ? (
        <div className={compactTitle ? "mt-4 w-full" : "mt-6 w-full"}>
          <PaymentHighlight section={paymentSection} />
        </div>
      ) : null}
      <ScamAlert
        className={compactTitle ? "mt-4 w-full" : "mt-6 w-full"}
        likelyScam={analysis.likely_scam}
        scamRisk={analysis.scam_risk}
        scamSignals={analysis.scam_signals}
      />
      <div className="mt-6 flex flex-col gap-8 lg:grid lg:grid-cols-5 lg:gap-10">
        <div className="min-w-0 space-y-6 lg:col-span-3 lg:order-1">
          {detailSections.map((section, idx) => (
            <SectionCard key={`${section.title}-${idx}`} section={section} />
          ))}
        </div>
        <div className="min-w-0 lg:col-span-2 lg:order-2">
          <RecommendationPanel analysis={analysis} />
        </div>
      </div>
    </div>
  );
}
