import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuotationBuilder } from "../hooks/useQuotationBuilder.js";
import QuotationBuilderHero from "../components/QuotationBuilderHero.jsx";
import QuotationBuilderTabs from "../components/QuotationBuilderTabs.jsx";
import CustomerConsumptionCard from "../components/CustomerConsumptionCard.jsx";
import SystemCapacitySelector from "../components/SystemCapacitySelector.jsx";
import PricingBreakdownCard from "../components/PricingBreakdownCard.jsx";
import SubsidyCalculationCard from "../components/SubsidyCalculationCard.jsx";
import QuotationSummaryCard from "../components/QuotationSummaryCard.jsx";
import QuotationActionBar from "../components/QuotationActionBar.jsx";
import QuotationPreviewDialog from "../components/QuotationPreviewDialog.jsx";
import { calculateAnnualGeneration } from "../utils/quotation-calculations.js";

function QuotationBuilderPage() {
  const navigate = useNavigate();
  const { data, isPending, isError, refetch } = useQuotationBuilder();
  const [selectedCapacity, setSelectedCapacity] = useState(3);
  const [activeTab, setActiveTab] = useState("system-details");
  const [notice, setNotice] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showPricingInfo, setShowPricingInfo] = useState(false);

  const annualGeneration = useMemo(() => {
    if (!data) return 0;
    return calculateAnnualGeneration(selectedCapacity, data.generation.unitsPerKwPerYear);
  }, [data, selectedCapacity]);

  function navigateToSection(sectionId) {
    setActiveTab(sectionId);

    if (sectionId === "quotation-summary") {
      setPreviewOpen(true);
      return;
    }

    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function handleSaveDraft() {
    setNotice("Draft retained in this page session only. It has not been saved to a server.");
  }

  function handleGeneratePdf() {
    setNotice("PDF generation is not connected yet. No PDF was created. The authenticated backend will generate the final PDF after verified pricing and subsidy data are available.");
  }

  if (isPending) {
    return <div className="space-y-5" aria-label="Loading Quotation Builder"><div className="h-28 animate-pulse rounded-2xl bg-slate-200" /><div className="h-14 animate-pulse rounded-2xl bg-slate-200" /><div className="h-[520px] animate-pulse rounded-2xl bg-slate-200" /></div>;
  }

  if (isError || !data) {
    return (
      <section className="rounded-2xl border border-red-200 bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-brand-text">Quotation Builder could not be loaded</h2>
        <p className="mt-2 text-sm text-brand-muted">The demo quotation data could not be retrieved.</p>
        <button type="button" onClick={() => refetch()} className="mt-5 rounded-xl bg-brand-emerald px-5 py-2.5 text-sm font-semibold text-white">Try again</button>
      </section>
    );
  }

  return (
    <div id="system-details" className="min-w-0 scroll-mt-6 space-y-4 sm:space-y-5">
      <QuotationBuilderHero />

      <QuotationBuilderTabs activeTab={activeTab} onNavigate={navigateToSection} />

      <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.48fr)] xl:gap-5">
        <div id="system-details" className="min-w-0 scroll-mt-6 space-y-4 sm:space-y-5">
          <CustomerConsumptionCard customer={data.customer} onOpenLeads={() => navigate("/leads")} />

          <SystemCapacitySelector
            options={data.systemOptions}
            selectedCapacity={selectedCapacity}
            onChange={(capacity) => {
              setSelectedCapacity(capacity);
              setNotice("");
            }}
            unitsPerKwPerYear={data.generation.unitsPerKwPerYear}
          />

          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2" id="pricing-subsidy" className="scroll-mt-6">
            <PricingBreakdownCard pricing={data.pricing} onConfigure={() => setShowPricingInfo(true)} />
            <SubsidyCalculationCard rule={data.subsidyRule} selectedCapacity={selectedCapacity} />
          </div>
        </div>

        <div className="min-w-0 xl:sticky xl:top-5">
          <QuotationSummaryCard
            capacityKw={selectedCapacity}
            generation={data.generation}
            pricing={data.pricing}
            subsidyRule={data.subsidyRule}
            economics={data.economics}
          />
        </div>
      </div>

      <QuotationActionBar
        onBack={() => navigate("/bill-analysis")}
        onSaveDraft={handleSaveDraft}
        onPreview={() => setPreviewOpen(true)}
        onGeneratePdf={handleGeneratePdf}
      />

      {notice && (
        <div role="status" className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-900">
          {notice}
        </div>
      )}

      <p className="text-xs leading-5 text-brand-muted">{data.dataLabel} Annual generation is an assumption, not a performance guarantee. Pricing, subsidy eligibility, savings and payback require verified source data.</p>

      <QuotationPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        customer={data.customer}
        capacityKw={selectedCapacity}
        generation={data.generation}
        pricing={data.pricing}
        subsidyRule={data.subsidyRule}
      />

      {showPricingInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowPricingInfo(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="pricing-info-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h2 id="pricing-info-title" className="text-lg font-bold text-brand-text">Approved pricing is not configured</h2>
            <p className="mt-3 text-sm leading-6 text-brand-muted">Equipment and installation costs must come from the admin-managed pricing table, including effective-from and effective-to dates. This frontend demo has no approved rates, so it will not accept an assumed price or calculate net cost.</p>
            <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">Status: Awaiting verified input.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowPricingInfo(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-brand-text">Close</button>
              <button type="button" onClick={() => { setShowPricingInfo(false); navigateToSection("pricing-subsidy"); }} className="rounded-lg bg-brand-emerald px-4 py-2 text-sm font-semibold text-white">Pricing & Subsidy</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default QuotationBuilderPage;
